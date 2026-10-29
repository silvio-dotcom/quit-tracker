package io.github.silviodotcom.quittracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;

public final class WidgetUi {
    private static final int COLOR_BRAND = 0xFFF8B800;
    private static final int COLOR_MUTED = 0xFFFCE0A8;
    private static final int COLOR_TEXT = 0xFFFFFFFF;
    private static final int COLOR_MONEY = 0xFFFCE0A8;
    private static final int COLOR_CHIP = 0xFFFFFFFF;
    private static final int COLOR_CURRENT = 0xFFF8B800;
    private static final int COLOR_ETA = 0xFFFCE0A8;
    private static final int COLOR_EMPTY = 0xFF1F3C8C;
    private static final int COLOR_LEVEL = 0xFFF8B800;
    private static final int COLOR_NO_CHIP = 0xFF64748B;

    private WidgetUi() {}

    public static void updateAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        ComponentName cn = new ComponentName(context, QuitTrackerWidgetProvider.class);
        int[] ids = mgr.getAppWidgetIds(cn);
        for (int id : ids) {
            updateWidget(context, mgr, id);
        }
    }

    public static void updateWidget(Context context, AppWidgetManager mgr, int widgetId) {
        try {
            updateWidgetRich(context, mgr, widgetId);
        } catch (Exception e) {
            updateWidgetFallback(context, mgr, widgetId, e);
        }
    }

    private static void updateWidgetRich(Context context, AppWidgetManager mgr, int widgetId) {
        JSONObject snapshot = WidgetDataStore.load(context);
        WidgetComputer.Model model = WidgetComputer.compute(context, snapshot, System.currentTimeMillis());

        int minWidthDp = widgetMinWidthDp(context, mgr, widgetId);
        boolean compact = minWidthDp < 170;
        float scale = WidgetPixelText.scaleForWidth(minWidthDp) * (compact ? 0.92f : 1f);
        int textWidthPx = widthPx(context, minWidthDp);
        int heroLabelWidth = compact ? Math.max(48, textWidthPx / 4) : 80;

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quit_tracker);
        bindLaunchIntent(context, views, widgetId);

        views.setImageViewResource(R.id.widget_logo, R.drawable.widget_logo);
        views.setImageViewBitmap(R.id.widget_brand, WidgetPixelText.line(context, "SIN HUMO", 6f, COLOR_BRAND, textWidthPx, scale));

        if (!model.configured) {
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            views.setViewVisibility(R.id.widget_body, View.GONE);
            views.setViewVisibility(R.id.widget_level, View.GONE);
            views.setImageViewBitmap(
                R.id.widget_empty,
                WidgetPixelText.line(context, context.getString(R.string.widget_empty), 7f, COLOR_EMPTY, textWidthPx, scale)
            );
        } else {
            views.setViewVisibility(R.id.widget_empty, View.GONE);
            views.setViewVisibility(R.id.widget_body, View.VISIBLE);

            float smokeSp = compact ? 8f : 9f;
            views.setViewVisibility(R.id.widget_smoke_label, View.GONE);
            views.setImageViewBitmap(
                R.id.widget_smoke_time,
                WidgetPixelText.line(context, model.smokeTime, smokeSp, COLOR_TEXT, textWidthPx - heroLabelWidth, scale)
            );
            views.setImageViewBitmap(
                R.id.widget_money,
                WidgetPixelText.line(context, model.money, compact ? 7f : 8f, COLOR_MONEY, textWidthPx - heroLabelWidth, scale)
            );

            int currentCoinRes = WidgetComputer.coinDrawableRes(context, model.currentTierId);
            views.setImageViewResource(R.id.widget_current_coin, currentCoinRes);
            int currentColor = model.hasEarnedChip ? COLOR_CURRENT : COLOR_NO_CHIP;
            views.setImageViewBitmap(
                R.id.widget_current_chip_label,
                WidgetPixelText.line(context, model.currentLabel, compact ? 5f : 6f, currentColor, heroLabelWidth, scale)
            );

            if (model.showNextRow) {
                views.setViewVisibility(R.id.widget_next_row, View.VISIBLE);
                int nextRes = WidgetComputer.coinDrawableRes(context, model.nextTierId);
                views.setImageViewResource(R.id.widget_next_coin, nextRes);
                String sigLine = model.nextLabel;
                if (model.nextEta != null && !model.nextEta.isEmpty()) {
                    sigLine = model.nextLabel + " · " + model.nextEta;
                }
                views.setImageViewBitmap(
                    R.id.widget_chip_label,
                    WidgetPixelText.line(context, sigLine, compact ? 6f : 7f, COLOR_CHIP, textWidthPx, scale)
                );
                views.setImageViewBitmap(R.id.widget_chip_eta, WidgetPixelText.line(context, "", 6f, COLOR_ETA, 1, scale));
                views.setViewVisibility(R.id.widget_chip_eta, View.GONE);
            } else {
                views.setViewVisibility(R.id.widget_next_row, View.GONE);
                views.setImageViewBitmap(R.id.widget_chip_label, WidgetPixelText.line(context, "", 6f, COLOR_CHIP, 1, scale));
                views.setImageViewBitmap(R.id.widget_chip_eta, WidgetPixelText.line(context, "", 6f, COLOR_ETA, 1, scale));
            }

            views.setViewVisibility(R.id.widget_chip_progress, View.GONE);
            views.setViewVisibility(R.id.widget_block_progress, View.VISIBLE);
            views.setImageViewBitmap(
                R.id.widget_block_progress,
                WidgetPixelBlocks.progressRow(context, textWidthPx, dpPx(context, 10), model.chipProgress)
            );

            if (model.showLevel && model.levelPill != null) {
                views.setViewVisibility(R.id.widget_level, View.VISIBLE);
                views.setImageViewBitmap(
                    R.id.widget_level,
                    WidgetPixelText.line(context, model.levelPill, 6f, COLOR_LEVEL, textWidthPx / 2, scale)
                );
            } else {
                views.setViewVisibility(R.id.widget_level, View.GONE);
            }
        }

        mgr.updateAppWidget(widgetId, views);
    }

    private static void updateWidgetFallback(Context context, AppWidgetManager mgr, int widgetId, Exception err) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quit_tracker_fallback);
        bindLaunchIntent(context, views, widgetId);
        views.setTextViewText(R.id.widget_fallback_text, context.getString(R.string.widget_empty));
        mgr.updateAppWidget(widgetId, views);
    }

    private static void bindLaunchIntent(Context context, RemoteViews views, int widgetId) {
        Intent launch = new Intent(context, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(context, widgetId, launch, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pi);
    }

    private static int widgetMinWidthDp(Context context, AppWidgetManager mgr, int widgetId) {
        Bundle options = mgr.getAppWidgetOptions(widgetId);
        if (options != null) {
            int min = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
            if (min > 0) return min;
        }
        return 250;
    }

    private static int widthPx(Context context, int widthDp) {
        float density = context.getResources().getDisplayMetrics().density;
        return Math.max(1, (int) (widthDp * density));
    }

    private static int dpPx(Context context, int dp) {
        return Math.max(1, (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, context.getResources().getDisplayMetrics()));
    }
}
