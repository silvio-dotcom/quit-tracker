package io.github.silviodotcom.quittracker;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;

/** Block-style chip progress row for Plataformas widget. */
public final class WidgetPixelBlocks {
    private static final int COLOR_USED = 0xFFC84C0C;
    private static final int COLOR_USED_DARK = 0xFF7A2B00;
    private static final int COLOR_Q = 0xFFF8B800;
    private static final int COLOR_BORDER = 0xFF000000;

    private WidgetPixelBlocks() {}

    public static Bitmap progressRow(Context context, int widthPx, int heightPx, int progressPct) {
        int blocks = 10;
        int filled = Math.round((Math.max(0, Math.min(100, progressPct)) / 100f) * blocks);
        int gap = 2;
        int blockW = Math.max(4, (widthPx - gap * (blocks - 1)) / blocks);
        int h = Math.max(6, heightPx);
        Bitmap bmp = Bitmap.createBitmap(Math.max(1, widthPx), h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.FILL);
        for (int i = 0; i < blocks; i++) {
            int x = i * (blockW + gap);
            p.setColor(COLOR_BORDER);
            canvas.drawRect(x, 0, x + blockW, h, p);
            p.setColor(i < filled ? COLOR_USED : COLOR_Q);
            canvas.drawRect(x + 2, 2, x + blockW - 2, h - 2, p);
            if (i < filled) {
                p.setColor(COLOR_USED_DARK);
                canvas.drawRect(x + 2, h - 4, x + blockW - 2, h - 2, p);
            }
        }
        return bmp;
    }
}
