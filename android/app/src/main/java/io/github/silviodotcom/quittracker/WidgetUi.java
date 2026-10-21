package io.github.silviodotcom.quittracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;

public final class WidgetUi {
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
        JSONObject snapshot = WidgetDataStore.load(context);
        WidgetComputer.Model model = WidgetComputer.compute(context, snapshot, System.currentTimeMillis());

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quit_tracker);

        Intent launch = new Intent(context, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getActivity(context, widgetId, launch, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pi);

        if (!model.configured) {
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            views.setViewVisibility(R.id.widget_body, View.GONE);
            views.setViewVisibility(R.id.widget_level, View.GONE);
        } else {
            views.setViewVisibility(R.id.widget_empty, View.GONE);
            views.setViewVisibility(R.id.widget_body, View.VISIBLE);
            views.setTextViewText(R.id.widget_smoke_time, model.smokeTime);
            views.setTextViewText(R.id.widget_money, model.money);
            views.setTextViewText(R.id.widget_chip_label, model.chipLabel);
            views.setTextViewText(R.id.widget_chip_eta, model.chipEta);
            views.setProgressBar(R.id.widget_chip_progress, 100, model.chipProgress, false);
            views.setViewVisibility(R.id.widget_chip_progress, View.VISIBLE);
            int coinRes = WidgetComputer.coinDrawableRes(context, model.chipTierId);
            views.setImageViewResource(R.id.widget_coin, coinRes);

            if (model.showLevel && model.levelPill != null) {
                views.setViewVisibility(R.id.widget_level, View.VISIBLE);
                views.setTextViewText(R.id.widget_level, model.levelPill);
            } else {
                views.setViewVisibility(R.id.widget_level, View.GONE);
            }
        }

        mgr.updateAppWidget(widgetId, views);
    }
}
