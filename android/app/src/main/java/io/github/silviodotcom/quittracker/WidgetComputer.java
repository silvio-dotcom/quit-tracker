package io.github.silviodotcom.quittracker;

import android.content.Context;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Mirrors web stats/chips formulas for the home screen widget. */
public final class WidgetComputer {
    private static final long MS_HOUR = 60L * 60L * 1000L;
    private static final long MS_DAY = 24L * MS_HOUR;
    private static final long MAX_CHIP_MS = 365L * MS_DAY;

    public static final class ChipTier {
        public final String id;
        public final String label;
        public final long ms;
        public final String rim;

        ChipTier(String id, String label, long ms, String rim) {
            this.id = id;
            this.label = label;
            this.ms = ms;
            this.rim = rim;
        }
    }

    public static final class Model {
        public boolean configured;
        public String smokeTime;
        public String money;
        public String chipLabel;
        public String chipEta;
        public int chipProgress;
        public String chipTierId = "chip-24h";
        public String levelPill;
        public boolean showLevel;
    }

    private static List<ChipTier> ladder;

    private WidgetComputer() {}

    public static synchronized List<ChipTier> chipLadder(Context context) {
        if (ladder != null) return ladder;
        ladder = new ArrayList<>();
        try {
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(context.getAssets().open("widget-chip-ladder.json"), StandardCharsets.UTF_8)
            );
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();
            JSONArray arr = new JSONArray(sb.toString());
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                ladder.add(
                    new ChipTier(
                        o.getString("id"),
                        o.getString("label"),
                        o.getLong("ms"),
                        o.optString("rim", "#94a3b8")
                    )
                );
            }
        } catch (Exception e) {
            ladder = new ArrayList<>();
        }
        return ladder;
    }

    public static Model compute(Context context, JSONObject snapshot, long nowMs) {
        Model m = new Model();
        if (snapshot == null) {
            m.configured = false;
            return m;
        }

        String quitIso = snapshot.optString("quitDateIso", null);
        if (quitIso == null || quitIso.isEmpty() || "null".equals(quitIso)) {
            m.configured = false;
            return m;
        }

        long quitMs;
        try {
            quitMs = java.time.Instant.parse(quitIso).toEpochMilli();
        } catch (Exception e) {
            m.configured = false;
            return m;
        }

        long elapsed = Math.max(0, nowMs - quitMs);
        if (elapsed <= 0) {
            m.configured = false;
            return m;
        }

        m.configured = true;

        int level = snapshot.optInt("level", 0);
        int maxLevel = snapshot.optInt("maxLevel", 20);
        if (level > 0) {
            m.showLevel = true;
            String maxSuffix = snapshot.optBoolean("levelMaxed", false) ? " MAX" : "";
            m.levelPill = "LV " + level + "/" + maxLevel + maxSuffix;
        }

        long totalSec = elapsed / 1000L;
        long days = totalSec / 86400L;
        long hours = (totalSec % 86400L) / 3600L;
        long minutes = (totalSec % 3600L) / 60L;
        if (days >= 1) {
            m.smokeTime = days + (days == 1 ? " DAY " : " DAYS ") + hours + (hours == 1 ? " HR" : " HRS");
        } else {
            m.smokeTime = hours + (hours == 1 ? " HR " : " HRS ") + minutes + (minutes == 1 ? " MIN" : " MIN");
        }

        double cigsPerDay = snapshot.optDouble("cigsPerDay", 0);
        double cigsPerPack = snapshot.optDouble("cigsPerPack", 20);
        double packPrice = snapshot.optDouble("packPrice", 0);
        if (cigsPerPack <= 0) cigsPerPack = 20;
        double pricePerCig = packPrice / cigsPerPack;
        long cigsAvoided = (long) Math.floor((elapsed * cigsPerDay) / (double) MS_DAY);
        double money = cigsAvoided * pricePerCig;
        String sym = snapshot.optString("currencySymbol", "$");
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.US);
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        m.money = sym + nf.format(money);

        List<ChipTier> tiers = chipLadder(context);
        ChipTier highest = null;
        ChipTier next = null;
        for (ChipTier tier : tiers) {
            if (elapsed >= tier.ms) {
                highest = tier;
            } else if (next == null) {
                next = tier;
            }
        }

        boolean atMax = highest != null && highest.ms >= MAX_CHIP_MS;
        long prevMs = highest != null ? highest.ms : 0L;
        if (atMax) {
            m.chipLabel = "1 YEAR · MAX";
            m.chipEta = "Complete";
            m.chipProgress = 100;
            m.chipTierId = "chip-1y";
        } else if (next != null) {
            m.chipLabel = "NEXT: " + next.label;
            long remain = next.ms - elapsed;
            m.chipEta = formatChipRemaining(remain);
            m.chipTierId = next.id;
            prevMs = highest != null ? highest.ms : 0L;
            long span = next.ms - prevMs;
            long into = elapsed - prevMs;
            m.chipProgress = span > 0 ? (int) Math.min(100, (into * 100L) / span) : 0;
        } else if (highest != null) {
            m.chipLabel = highest.label;
            m.chipEta = "";
            m.chipTierId = highest.id;
            m.chipProgress = 100;
        } else {
            m.chipLabel = "NEXT: 24 HRS";
            m.chipEta = formatChipRemaining(Math.max(0, MS_DAY - elapsed));
            m.chipTierId = "chip-24h";
            m.chipProgress = (int) Math.min(100, (elapsed * 100L) / MS_DAY);
        }

        return m;
    }

    public static int coinDrawableRes(Context context, String chipTierId) {
        if (chipTierId == null || chipTierId.isEmpty()) chipTierId = "chip-24h";
        String name = "widget_coin_" + chipTierId.replace('-', '_');
        int id = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
        if (id != 0) return id;
        return context.getResources().getIdentifier("widget_coin_chip_24h", "drawable", context.getPackageName());
    }

    static String formatChipRemaining(long ms) {
        if (ms <= 0) return "Now";
        long h = ms / MS_HOUR;
        if (h >= 24) {
            long d = h / 24;
            return d + "d left";
        }
        if (h >= 1) return h + "h left";
        long m = Math.max(1, ms / (60L * 1000L));
        return m + "m left";
    }
}
