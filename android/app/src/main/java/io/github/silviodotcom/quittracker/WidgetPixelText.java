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
    private static final int SHADOW = 0xFF1F3C8C;

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
        if (text.contains("D\u00cdAS") || text.contains("D\u00cdA")) {
            return lineWithPixelDias(context, text, sp, color, maxWidthPx, scale);
        }
        return linePlain(context, text, sp, color, maxWidthPx, scale);
    }

    private static TextPaint basePaint(Context context, float sp, float scale) {
        TextPaint paint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        paint.setAntiAlias(false);
        paint.setSubpixelText(false);
        paint.setFilterBitmap(false);
        paint.setTypeface(pixelFont(context));
        paint.setTextSize(sp * scale * context.getResources().getDisplayMetrics().scaledDensity);
        return paint;
    }

    private static void drawShadowedText(Canvas canvas, TextPaint paint, String text, float x, float y, int color) {
        paint.setColor(SHADOW);
        canvas.drawText(text, x + 1f, y + 1f, paint);
        paint.setColor(color);
        canvas.drawText(text, x, y, paint);
    }

    /** D + pixel accent + AS/ A (Press Start 2P reads Í as lowercase). */
    private static Bitmap lineWithPixelDias(Context context, String text, float sp, int color, int maxWidthPx, float scale) {
        TextPaint paint = basePaint(context, sp, scale);
        String normalized = text.replace("D\u00cdAS", "DIAS").replace("D\u00cdA", "DIA");
        float size = paint.getTextSize();
        float w = paint.measureText(normalized);
        int bmpW = Math.max(1, Math.min(maxWidthPx, (int) Math.ceil(w + 2)));
        int h = Math.max(1, (int) (size * 1.2f));
        Bitmap bmp = Bitmap.createBitmap(bmpW, h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        float x = 0;
        float baseline = size;
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            String s = String.valueOf(c);
            drawShadowedText(canvas, paint, s, x, baseline, color);
            if (c == 'I') {
                float px = Math.max(1f, size * 0.1f);
                Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
                dot.setAntiAlias(false);
                dot.setColor(color);
                float left = x + size * 0.38f;
                float top = baseline - size * 0.72f;
                canvas.drawRect(left, top, left + px, top + px, dot);
                canvas.drawRect(left + px, top - px, left + px * 2, top, dot);
            }
            x += paint.measureText(s);
        }
        return bmp;
    }

    private static Bitmap linePlain(Context context, String text, float sp, int color, int maxWidthPx, float scale) {
        TextPaint paint = basePaint(context, sp, scale);
        StaticLayout layout = StaticLayout.Builder.obtain(text, 0, text.length(), paint, Math.max(1, maxWidthPx))
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.1f)
            .setIncludePad(false)
            .build();

        int h = Math.max(1, layout.getHeight() + 1);
        Bitmap bmp = Bitmap.createBitmap(Math.max(1, maxWidthPx), h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        paint.setColor(SHADOW);
        canvas.save();
        canvas.translate(1f, 1f);
        layout.draw(canvas);
        canvas.restore();
        paint.setColor(color);
        layout.draw(canvas);
        return bmp;
    }
}
