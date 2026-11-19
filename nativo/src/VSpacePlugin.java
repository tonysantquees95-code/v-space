package tech.vetorial.vspace;

import android.Manifest;
import android.app.Activity;
import android.app.role.RoleManager;
import android.content.BroadcastReceiver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.database.Cursor;
import android.content.ComponentName;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.BatteryManager;
import android.provider.CalendarContract;
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
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** A ponte do V-Space com o Android: apps instalados, abrir, desinstalar, launcher padrão e backup em arquivo. */
@CapacitorPlugin(name = "VetorialHome", permissions = { @Permission(strings = { Manifest.permission.READ_CALENDAR }, alias = "agenda") })
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
                    try { a.put("instalado", pm.getPackageInfo(pacote, 0).firstInstallTime); } catch (Exception ignora) { }
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

    /** Tamanho das barras do sistema (dp), para a tela web ficar entre elas com o fundo aparecendo por trás. */
    @PluginMethod
    public void barras(PluginCall call) {
        float[] b = MainActivity.barrasDp;
        JSObject r = new JSObject();
        r.put("topo", b[0]); r.put("base", b[1]); r.put("esq", b[2]); r.put("dir", b[3]); r.put("teclado", b.length > 4 ? b[4] : 0);
        call.resolve(r);
    }

    /** Abre um link da web no navegador do aparelho (só http e https). */
    @PluginMethod
    public void abrirUrl(PluginCall call) {
        String url = call.getString("url", "");
        if (!(url.startsWith("https://") || url.startsWith("http://")) || url.length() > 2000) { call.reject("Link inválido."); return; }
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); call.resolve(); } catch (Exception e) { call.reject("Não consegui abrir o link: " + e.getMessage()); }
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

    // ---- música que está tocando (precisa do acesso às notificações; o V-Space só lê a sessão de mídia)
    private boolean musicaLiberada() {
        String lista = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        return lista != null && lista.contains(getContext().getPackageName());
    }

    @PluginMethod
    public void musicaPermitida(PluginCall call) {
        JSObject r = new JSObject();
        r.put("permitida", musicaLiberada());
        call.resolve(r);
    }

    @PluginMethod
    public void pedirMusica(PluginCall call) {
        try {
            Intent i = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) { call.reject("Não consegui abrir os ajustes: " + e.getMessage()); }
    }

    private MediaController sessaoAtiva() {
        if (!musicaLiberada()) return null;
        try {
            MediaSessionManager m = (MediaSessionManager) getContext().getSystemService(Context.MEDIA_SESSION_SERVICE);
            List<MediaController> lista = m.getActiveSessions(new ComponentName(getContext(), MusicaListener.class));
            MediaController escolhida = null;
            for (MediaController c : lista) {
                PlaybackState p = c.getPlaybackState();
                if (c.getMetadata() == null) continue;
                if (p != null && p.getState() == PlaybackState.STATE_PLAYING) return c;
                if (escolhida == null && p != null && (p.getState() == PlaybackState.STATE_PAUSED)) escolhida = c;
            }
            return escolhida;
        } catch (Exception e) { return null; }
    }

    @PluginMethod
    public void musica(final PluginCall call) {
        fundo.execute(() -> {
            JSObject r = new JSObject();
            MediaController c = sessaoAtiva();
            if (c == null) { r.put("tem", false); call.resolve(r); return; }
            MediaMetadata md = c.getMetadata();
            PlaybackState p = c.getPlaybackState();
            String pacote = c.getPackageName();
            String nomeApp = pacote;
            try { nomeApp = String.valueOf(getContext().getPackageManager().getApplicationLabel(getContext().getPackageManager().getApplicationInfo(pacote, 0))); } catch (Exception ignora) { }
            r.put("tem", true);
            r.put("pacote", pacote);
            r.put("app", nomeApp);
            r.put("titulo", md.getString(MediaMetadata.METADATA_KEY_TITLE) == null ? "" : md.getString(MediaMetadata.METADATA_KEY_TITLE));
            String art = md.getString(MediaMetadata.METADATA_KEY_ARTIST);
            if (art == null) art = md.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
            r.put("artista", art == null ? "" : art);
            r.put("tocando", p != null && p.getState() == PlaybackState.STATE_PLAYING);
            Bitmap capa = md.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
            if (capa == null) capa = md.getBitmap(MediaMetadata.METADATA_KEY_ART);
            if (capa != null) {
                try {
                    Bitmap p96 = Bitmap.createScaledBitmap(capa, 96, 96, true);
                    ByteArrayOutputStream bo = new ByteArrayOutputStream();
                    p96.compress(Bitmap.CompressFormat.JPEG, 80, bo);
                    r.put("capa", "data:image/jpeg;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
                } catch (Exception ignora) { }
            }
            call.resolve(r);
        });
    }

    @PluginMethod
    public void musicaComando(PluginCall call) {
        String acao = call.getString("acao", "");
        MediaController c = sessaoAtiva();
        if (c == null) { call.reject("Nada tocando."); return; }
        MediaController.TransportControls t = c.getTransportControls();
        switch (acao) {
            case "pausar": t.pause(); break;
            case "tocar": t.play(); break;
            case "proxima": t.skipToNext(); break;
            case "anterior": t.skipToPrevious(); break;
            case "parar": t.stop(); break;
            default: call.reject("Comando inválido."); return;
        }
        call.resolve();
    }

    // ---- atalhos do sistema: rede, volume e ajustes
    @PluginMethod
    public void sistema(PluginCall call) {
        JSObject r = new JSObject();
        boolean wifi = false, movel = false;
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            Network n = cm.getActiveNetwork();
            NetworkCapabilities nc = n == null ? null : cm.getNetworkCapabilities(n);
            if (nc != null) { wifi = nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI); movel = nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR); }
        } catch (Exception ignora) { }
        int volume = 0;
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            int max = Math.max(1, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC));
            volume = Math.round(100f * am.getStreamVolume(AudioManager.STREAM_MUSIC) / max);
        } catch (Exception ignora) { }
        r.put("wifi", wifi); r.put("movel", movel); r.put("volume", volume);
        call.resolve(r);
    }

    @PluginMethod
    public void mostrarVolume(PluginCall call) {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_SAME, AudioManager.FLAG_SHOW_UI);
            call.resolve();
        } catch (Exception e) { call.reject("Não consegui abrir o volume."); }
    }

    /** Abre uma tela de ajustes do sistema (só estas): wifi, rede móvel ou bateria. */
    @PluginMethod
    public void abrirAjuste(PluginCall call) {
        String tela = call.getString("tela", "");
        String acao;
        switch (tela) {
            case "wifi": acao = Settings.ACTION_WIFI_SETTINGS; break;
            case "rede": acao = Settings.ACTION_WIRELESS_SETTINGS; break;
            case "bateria": acao = Intent.ACTION_POWER_USAGE_SUMMARY; break;
            default: call.reject("Ajuste inválido."); return;
        }
        try { getContext().startActivity(new Intent(acao).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); call.resolve(); }
        catch (Exception e) { call.reject("Não consegui abrir os ajustes."); }
    }

    // ---- widgets: bateria e agenda
    @PluginMethod
    public void bateria(PluginCall call) {
        Intent i = getContext().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        JSObject o = new JSObject();
        int nivel = i == null ? -1 : i.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int escala = i == null ? 100 : i.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
        int estado = i == null ? -1 : i.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        o.put("nivel", nivel < 0 || escala <= 0 ? 0 : (nivel * 100) / escala);
        o.put("carregando", estado == BatteryManager.BATTERY_STATUS_CHARGING || estado == BatteryManager.BATTERY_STATUS_FULL);
        call.resolve(o);
    }

    @PluginMethod
    public void agendaPermitida(PluginCall call) {
        JSObject o = new JSObject();
        o.put("permitida", getPermissionState("agenda") == PermissionState.GRANTED);
        call.resolve(o);
    }

    @PluginMethod
    public void pedirAgenda(PluginCall call) {
        if (getPermissionState("agenda") == PermissionState.GRANTED) { agendaPermitida(call); return; }
        requestPermissionForAlias("agenda", call, "fimAgenda");
    }

    @PermissionCallback
    private void fimAgenda(PluginCall call) { agendaPermitida(call); }

    /** Próximos eventos (agora até o fim de amanhã), no máximo 4. Só lê, nunca grava na agenda. */
    @PluginMethod
    public void eventosHoje(final PluginCall call) {
        if (getPermissionState("agenda") != PermissionState.GRANTED) { call.reject("Sem permissão da agenda."); return; }
        fundo.execute(new Runnable() {
            @Override
            public void run() {
                JSArray lista = new JSArray();
                java.util.Calendar fim = java.util.Calendar.getInstance();
                fim.add(java.util.Calendar.DAY_OF_YEAR, 1);
                fim.set(java.util.Calendar.HOUR_OF_DAY, 23); fim.set(java.util.Calendar.MINUTE, 59);
                long agora = System.currentTimeMillis();
                Uri.Builder b = CalendarContract.Instances.CONTENT_URI.buildUpon();
                ContentUris.appendId(b, agora);
                ContentUris.appendId(b, fim.getTimeInMillis());
                String[] cols = { CalendarContract.Instances.TITLE, CalendarContract.Instances.BEGIN, CalendarContract.Instances.END, CalendarContract.Instances.ALL_DAY };
                try (Cursor c = getContext().getContentResolver().query(b.build(), cols, null, null, CalendarContract.Instances.BEGIN + " ASC")) {
                    while (c != null && c.moveToNext() && lista.length() < 4) {
                        JSObject e = new JSObject();
                        String t = c.getString(0);
                        e.put("titulo", t == null || t.trim().isEmpty() ? "Sem título" : t);
                        e.put("inicio", c.getLong(1));
                        e.put("fim", c.getLong(2));
                        e.put("diaTodo", c.getInt(3) == 1);
                        lista.put(e);
                    }
                } catch (Exception ignora) { }
                JSObject o = new JSObject();
                o.put("eventos", lista);
                call.resolve(o);
            }
        });
    }
}
