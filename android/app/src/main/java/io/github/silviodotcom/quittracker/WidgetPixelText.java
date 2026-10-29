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
        if (needsDiasAccent(text)) {
            return lineWithPixelDias(context, text, sp, color, maxWidthPx, scale);
        }
        return linePlain(context, text, sp, color, maxWidthPx, scale);
    }

    /** Matches web .ia / .pixel-accent-i (Press Start 2P Í reads as plain i). */
    static boolean needsDiasAccent(String text) {
        return text.contains("D\u00cdAS")
            || text.contains("D\u00cdA")
            || text.contains("DIAS")
            || text.contains("DIA");
    }

    static String normalizeDiasWords(String text) {
        return text.replace("D\u00cdAS", "DIAS").replace("D\u00cdA", "DIA");
    }

    static void drawPixelAccentOnI(Canvas canvas, Paint dot, float x, float baseline, float size, int color) {
        float px = Math.max(3f, size * 0.14f);
        dot.setColor(color);
        float left = x + size * 0.35f;
        float top = baseline - size * 1.28f;
        canvas.drawRect(left, top, left + px, top + px, dot);
        canvas.drawRect(left + px, top - px, left + px * 2f, top, dot);
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
        String normalized = normalizeDiasWords(text);
        float size = paint.getTextSize();
        float accentPad = size * 0.45f;
        float w = paint.measureText(normalized);
        int bmpW = Math.max(1, Math.min(maxWidthPx, (int) Math.ceil(w + 2)));
        int h = Math.max(1, (int) Math.ceil(size * 1.15f + accentPad));
        Bitmap bmp = Bitmap.createBitmap(bmpW, h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        float x = 0;
        float baseline = size + accentPad * 0.5f;
        Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
        dot.setAntiAlias(false);
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            String s = String.valueOf(c);
            drawShadowedText(canvas, paint, s, x, baseline, color);
            if (c == 'I' && isDiasAccentI(normalized, i)) {
                drawPixelAccentOnI(canvas, dot, x, baseline, size, color);
            }
            x += paint.measureText(s);
        }
        return bmp;
    }

    /** Accent the I in DIA / DIAS only (not every capital I in the string). */
    private static boolean isDiasAccentI(String normalized, int i) {
        if (i <= 0 || normalized.charAt(i) != 'I') return false;
        if (normalized.charAt(i - 1) != 'D') return false;
        if (i + 1 < normalized.length()) {
            char n = normalized.charAt(i + 1);
            return n == 'A' || n == 'S';
        }
        return normalized.regionMatches(i - 1, "DIA", 0, 3);
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
