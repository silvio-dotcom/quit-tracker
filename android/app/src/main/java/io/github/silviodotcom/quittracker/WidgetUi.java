package io.github.silviodotcom.quittracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;

public final class WidgetUi {
    private static final int COLOR_BRAND = 0xFF86EFAC;
    private static final int COLOR_MUTED = 0xFF64748B;
    private static final int COLOR_TEXT = 0xFFF3F6F9;
    private static final int COLOR_MONEY = 0xFF22C55E;
    private static final int COLOR_CHIP = 0xFFE2E8F0;
    private static final int COLOR_ETA = 0xFF86EFAC;
    private static final int COLOR_EMPTY = 0xFF94A3B8;
    private static final int COLOR_LEVEL = 0xFF22C55E;

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
        float scale = WidgetPixelText.scaleForWidth(minWidthDp);
        int textWidthPx = widthPx(context, minWidthDp);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quit_tracker);
        bindLaunchIntent(context, views, widgetId);

        views.setImageViewResource(R.id.widget_logo, R.drawable.widget_logo);
        views.setImageViewBitmap(R.id.widget_brand, WidgetPixelText.line(context, "QUIT", 7f, COLOR_BRAND, textWidthPx, scale));

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

            views.setImageViewBitmap(
                R.id.widget_smoke_label,
                WidgetPixelText.line(context, "SMOKE-FREE", 6f, COLOR_MUTED, textWidthPx, scale)
            );
            views.setImageViewBitmap(
                R.id.widget_smoke_time,
                WidgetPixelText.line(context, model.smokeTime, 9f, COLOR_TEXT, textWidthPx, scale)
            );
            views.setImageViewBitmap(
                R.id.widget_money,
                WidgetPixelText.line(context, model.money, 8f, COLOR_MONEY, textWidthPx, scale)
            );
            views.setImageViewBitmap(
                R.id.widget_chip_label,
                WidgetPixelText.line(context, model.chipLabel, 7f, COLOR_CHIP, textWidthPx, scale)
            );
            views.setImageViewBitmap(
                R.id.widget_chip_eta,
                WidgetPixelText.line(context, model.chipEta, 6f, COLOR_ETA, textWidthPx, scale)
            );

            views.setProgressBar(R.id.widget_chip_progress, 100, model.chipProgress, false);
            views.setViewVisibility(R.id.widget_chip_progress, View.VISIBLE);

            int coinRes = WidgetComputer.coinDrawableRes(context, model.chipTierId);
            if (coinRes != 0) {
                views.setImageViewResource(R.id.widget_coin, coinRes);
            }

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
        String msg = context.getString(R.string.widget_empty);
        views.setTextViewText(R.id.widget_fallback_text, msg);
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
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            250,
            context.getResources().getDisplayMetrics()
        );
    }

    private static int widthPx(Context context, int widthDp) {
        float density = context.getResources().getDisplayMetrics().density;
        return Math.max(1, (int) (widthDp * density));
    }
}
