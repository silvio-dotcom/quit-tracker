package io.github.silviodotcom.quittracker;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;

public final class WidgetDataStore {
    private static final String PREFS = "quit_tracker_widget";
    private static final String KEY_SNAPSHOT = "snapshot_json";

    private WidgetDataStore() {}

    public static void save(Context context, String snapshotJson) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_SNAPSHOT, snapshotJson).apply();
    }

    public static JSONObject load(Context context) {
        try {
            SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_SNAPSHOT, null);
            if (raw == null || raw.isEmpty()) return null;
            return new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }
}
