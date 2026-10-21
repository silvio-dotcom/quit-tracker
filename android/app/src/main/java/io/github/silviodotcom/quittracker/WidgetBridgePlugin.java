package io.github.silviodotcom.quittracker;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void sync(PluginCall call) {
        JSObject snapshot = call.getObject("snapshot");
        if (snapshot == null) {
            call.reject("snapshot required");
            return;
        }
        WidgetDataStore.save(getContext(), snapshot.toString());
        QuitTrackerWidgetProvider.requestUpdate(getContext());
        call.resolve();
    }
}
