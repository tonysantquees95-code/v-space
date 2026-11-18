package tech.vetorial.vspace;

import android.app.Activity;
import android.app.role.RoleManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** A ponte do V-Space com o Android: apps instalados, abrir, desinstalar, launcher padrão e backup em arquivo. */
@CapacitorPlugin(name = "VetorialHome")
public class VSpacePlugin extends Plugin {
    private final ExecutorService fundo = Executors.newSingleThreadExecutor();
    private BroadcastReceiver observador;
    private static final int LADO_ICONE = 108;

    @Override
    public void load() {
        observador = new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) { notifyListeners("appsMudaram", new JSObject()); }
        };
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_PACKAGE_ADDED);
        f.addAction(Intent.ACTION_PACKAGE_REMOVED);
        f.addAction(Intent.ACTION_PACKAGE_REPLACED);
        f.addDataScheme("package");
        getContext().registerReceiver(observador, f);
    }

    @Override
    protected void handleOnDestroy() {
        try { if (observador != null) getContext().unregisterReceiver(observador); } catch (Exception ignora) { }
        fundo.shutdownNow();
    }

    private static String icone(Drawable d) {
        try {
            Bitmap b = Bitmap.createBitmap(LADO_ICONE, LADO_ICONE, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, LADO_ICONE, LADO_ICONE);
            d.draw(c);
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 100, o);
            return Base64.encodeToString(o.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) { return null; }
    }

    @PluginMethod
    public void listarApps(final PluginCall call) {
        fundo.execute(() -> {
            try {
                PackageManager pm = getContext().getPackageManager();
                Intent q = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
                List<ResolveInfo> lista = pm.queryIntentActivities(q, 0);
                JSArray apps = new JSArray();
                java.util.HashSet<String> vistos = new java.util.HashSet<>();
                for (ResolveInfo r : lista) {
                    String pacote = r.activityInfo.packageName;
                    if (pacote.equals(getContext().getPackageName()) || !vistos.add(pacote)) continue;
                    JSObject a = new JSObject();
                    a.put("pacote", pacote);
                    a.put("nome", String.valueOf(r.loadLabel(pm)));
                    String ic = icone(r.loadIcon(pm));
                    if (ic != null) a.put("icone", ic);
                    apps.put(a);
                }
                JSObject res = new JSObject();
                res.put("apps", apps);
                call.resolve(res);
            } catch (Exception e) { call.reject("Não consegui listar os apps: " + e.getMessage()); }
        });
    }

    @PluginMethod
    public void abrir(PluginCall call) {
        String pacote = call.getString("pacote", "");
        Intent i = getContext().getPackageManager().getLaunchIntentForPackage(pacote);
        if (i == null) { call.reject("Esse app não pode ser aberto."); return; }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); call.resolve(); } catch (Exception e) { call.reject("Não consegui abrir: " + e.getMessage()); }
    }

    @PluginMethod
    public void detalhes(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + call.getString("pacote", ""))).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); call.resolve(); } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void desinstalar(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + call.getString("pacote", ""))).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); call.resolve(); } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void ehPadrao(PluginCall call) {
        Intent h = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        ResolveInfo r = getContext().getPackageManager().resolveActivity(h, PackageManager.MATCH_DEFAULT_ONLY);
        boolean eu = r != null && r.activityInfo != null && getContext().getPackageName().equals(r.activityInfo.packageName);
        JSObject o = new JSObject();
        o.put("padrao", eu);
        call.resolve(o);
    }

    @PluginMethod
    public void pedirPadrao(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                RoleManager rm = (RoleManager) getContext().getSystemService(Context.ROLE_SERVICE);
                if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) && !rm.isRoleHeld(RoleManager.ROLE_HOME)) {
                    startActivityForResult(call, rm.createRequestRoleIntent(RoleManager.ROLE_HOME), "fimPedirPadrao");
                    return;
                }
            }
            getContext().startActivity(new Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            call.resolve();
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @ActivityCallback
    private void fimPedirPadrao(PluginCall call, ActivityResult r) { if (call != null) call.resolve(); }

    @PluginMethod
    public void abrirAjustesInicio(PluginCall call) {
        try { getContext().startActivity(new Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); call.resolve(); }
        catch (Exception e) {
            try { getContext().startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); call.resolve(); } catch (Exception e2) { call.reject(e2.getMessage()); }
        }
    }

    // ---- backup em arquivo (a pessoa escolhe onde salvar / qual arquivo abrir) ----
    private String textoParaSalvar;

    @PluginMethod
    public void salvarArquivo(PluginCall call) {
        textoParaSalvar = call.getString("texto", "");
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE, call.getString("nome", "v-space-backup.json"));
        startActivityForResult(call, i, "fimSalvar");
    }

    @ActivityCallback
    private void fimSalvar(PluginCall call, ActivityResult r) {
        if (call == null) return;
        JSObject o = new JSObject();
        boolean ok = false;
        if (r.getResultCode() == Activity.RESULT_OK && r.getData() != null && r.getData().getData() != null) {
            try (OutputStream s = getContext().getContentResolver().openOutputStream(r.getData().getData(), "wt")) {
                s.write(textoParaSalvar.getBytes(StandardCharsets.UTF_8));
                ok = true;
            } catch (Exception ignora) { }
        }
        textoParaSalvar = null;
        o.put("ok", ok);
        call.resolve(o);
    }

    @PluginMethod
    public void lerArquivo(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
        startActivityForResult(call, i, "fimLer");
    }

    @ActivityCallback
    private void fimLer(PluginCall call, ActivityResult r) {
        if (call == null) return;
        JSObject o = new JSObject();
        String texto = null;
        if (r.getResultCode() == Activity.RESULT_OK && r.getData() != null && r.getData().getData() != null) {
            try (InputStream s = getContext().getContentResolver().openInputStream(r.getData().getData())) {
                ByteArrayOutputStream b = new ByteArrayOutputStream();
                byte[] buf = new byte[8192]; int n; long total = 0;
                while ((n = s.read(buf)) > 0) { total += n; if (total > 2_000_000) throw new Exception("arquivo grande demais"); b.write(buf, 0, n); }
                texto = b.toString("UTF-8");
            } catch (Exception ignora) { }
        }
        o.put("texto", texto == null ? JSObject.NULL : texto);
        call.resolve(o);
    }
}
