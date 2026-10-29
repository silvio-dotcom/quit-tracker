package io.github.silviodotcom.quittracker;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private Insets lastInsets;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        enableDisplayCutoutShortEdges();

        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
            lastInsets = combinedSystemAndCutoutInsets(windowInsets);
            pushInsetsToWebView();
            return windowInsets;
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        QuitTrackerWidgetProvider.requestUpdate(this);
        pushInsetsToWebView();
    }

    private void enableDisplayCutoutShortEdges() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            return;
        }
        WindowManager.LayoutParams lp = getWindow().getAttributes();
        lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        getWindow().setAttributes(lp);
    }

    /** Status/gesture bars plus display cutout (hole-punch) — WebView env(safe-area-*) is often 0. */
    private static Insets combinedSystemAndCutoutInsets(WindowInsetsCompat windowInsets) {
        Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
        Insets cutout = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());
        return Insets.of(
            Math.max(bars.left, cutout.left),
            Math.max(bars.top, cutout.top),
            Math.max(bars.right, cutout.right),
            Math.max(bars.bottom, cutout.bottom)
        );
    }

    private void pushInsetsToWebView() {
        if (lastInsets == null) {
            return;
        }
        Bridge bridge = getBridge();
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }
        int top = lastInsets.top;
        int bottom = lastInsets.bottom;
        int left = lastInsets.left;
        int right = lastInsets.right;
        String js =
            String.format(
                Locale.US,
                "(function(){var e=document.documentElement;"
                    + "e.style.setProperty('--sat','%1$dpx');"
                    + "e.style.setProperty('--sab','%2$dpx');"
                    + "e.style.setProperty('--sal','%3$dpx');"
                    + "e.style.setProperty('--sar','%4$dpx');"
                    + "e.style.setProperty('--safe-area-inset-top','%1$dpx');"
                    + "e.style.setProperty('--safe-area-inset-bottom','%2$dpx');"
                    + "e.style.setProperty('--safe-area-inset-left','%3$dpx');"
                    + "e.style.setProperty('--safe-area-inset-right','%4$dpx');"
                    + "e.style.setProperty('--safe-top','%1$dpx');"
                    + "e.style.setProperty('--safe-bottom','%2$dpx');"
                    + "e.style.setProperty('--safe-left','%3$dpx');"
                    + "e.style.setProperty('--safe-right','%4$dpx');})();",
                top,
                bottom,
                left,
                right
            );
        bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(js, null));
    }
}
