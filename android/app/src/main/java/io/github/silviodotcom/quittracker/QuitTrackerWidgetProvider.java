package io.github.silviodotcom.quittracker;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

public class QuitTrackerWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_REFRESH = "io.github.silviodotcom.quittracker.WIDGET_REFRESH";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            WidgetUi.updateWidget(context, appWidgetManager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_REFRESH.equals(intent.getAction())) {
            WidgetUi.updateAll(context);
            return;
        }
        super.onReceive(context, intent);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, android.os.Bundle newOptions) {
        WidgetUi.updateWidget(context, appWidgetManager, appWidgetId);
    }

    public static void requestUpdate(Context context) {
        WidgetUi.updateAll(context);
        Intent intent = new Intent(context, QuitTrackerWidgetProvider.class);
        intent.setAction(ACTION_REFRESH);
        context.sendBroadcast(intent);
    }
}
