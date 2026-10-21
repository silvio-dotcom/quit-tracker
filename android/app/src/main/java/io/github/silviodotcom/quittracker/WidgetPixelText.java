package io.github.silviodotcom.quittracker;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import androidx.core.content.res.ResourcesCompat;

/** Renders Press Start 2P lines to bitmaps for RemoteViews (custom fonts in XML are unsupported). */
public final class WidgetPixelText {
    private WidgetPixelText() {}

    public static Typeface pixelFont(Context context) {
        Typeface tf = ResourcesCompat.getFont(context, R.font.pressstart2p);
        return tf != null ? tf : Typeface.MONOSPACE;
    }

    public static float scaleForWidth(int widgetMinWidthDp) {
        return Math.max(0.75f, Math.min(1.35f, widgetMinWidthDp / 280f));
    }

    public static Bitmap line(Context context, String text, float sp, int color, int maxWidthPx, float scale) {
        if (text == null) text = "";
        TextPaint paint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        paint.setTypeface(pixelFont(context));
        paint.setTextSize(sp * scale * context.getResources().getDisplayMetrics().scaledDensity);
        paint.setColor(color);

        StaticLayout layout = StaticLayout.Builder.obtain(text, 0, text.length(), paint, Math.max(1, maxWidthPx))
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.15f)
            .setIncludePad(false)
            .build();

        int h = Math.max(1, layout.getHeight());
        Bitmap bmp = Bitmap.createBitmap(Math.max(1, maxWidthPx), h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        layout.draw(canvas);
        return bmp;
    }
}
