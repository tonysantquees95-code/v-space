package tech.vetorial.vspace;

import android.app.Activity;
import android.appwidget.AppWidgetHost;
import android.appwidget.AppWidgetHostView;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.Base64;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.RemoteViews;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Widgets reais de outros apps (Google Agenda, Bem-estar Digital...), como num launcher comum.
 * A tela web (HTML) reserva o espaço; aqui o Android desenha o widget por cima, no mesmo retângulo.
 * Por cima da WebView não dá para a tela web mexer no widget, então: segurar abre a edição (evento "widgetLongo")
 * e arrastar na vertical rola a tela (evento "widgetRolar").
 */
@CapacitorPlugin(name = "VetorialWidgets")
public class WidgetsPlugin extends Plugin {
    private static final int HOST_ID = 4242;
    private AppWidgetHost host;
    private AppWidgetManager gerente;
    private FrameLayout camada;
    private final Map<Integer, Envoltorio> vistas = new HashMap<>();
    private boolean ouvindo = false;

    @Override
    public void load() {
        gerente = AppWidgetManager.getInstance(getContext());
        host = new AppWidgetHost(getContext().getApplicationContext(), HOST_ID) {
            @Override
            protected AppWidgetHostView onCreateView(Context c, int id, AppWidgetProviderInfo info) { return new Vista(c); }
        };
    }

    @Override
    protected void handleOnStart() { iniciarEscuta(); }

    @Override
    protected void handleOnStop() { pararEscuta(); }

    @Override
    protected void handleOnDestroy() { pararEscuta(); }

    private void iniciarEscuta() {
        if (ouvindo || host == null) return;
        try { host.startListening(); ouvindo = true; } catch (Exception ignora) { }
    }

    private void pararEscuta() {
        if (!ouvindo || host == null) return;
        try { host.stopListening(); } catch (Exception ignora) { }
        ouvindo = false;
    }

    private float densidade() { return getContext().getResources().getDisplayMetrics().density; }

    private static String chave(ComponentName c) { return c.getPackageName() + "/" + c.getClassName(); }

    private static ComponentName componente(String s) {
        if (s == null) return null;
        int i = s.indexOf('/');
        if (i <= 0 || i >= s.length() - 1) return null;
        return new ComponentName(s.substring(0, i), s.substring(i + 1));
    }

    private AppWidgetProviderInfo achar(ComponentName c) {
        List<AppWidgetProviderInfo> todos = gerente.getInstalledProviders();
        for (AppWidgetProviderInfo p : todos) if (p.provider != null && p.provider.equals(c)) return p;
        return null;
    }

    /** Colunas e linhas (células de 70 dp) que o widget pede, limitadas à grade de 4 colunas do V-Space. */
    private int[] celulas(AppWidgetProviderInfo p) {
        int w, h;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && p.targetCellWidth > 0 && p.targetCellHeight > 0) {
            w = p.targetCellWidth; h = p.targetCellHeight;
        } else {
            float d = densidade();
            w = (int) Math.ceil((p.minWidth / d + 30) / 70f);
            h = (int) Math.ceil((p.minHeight / d + 30) / 70f);
        }
        return new int[] { Math.max(1, Math.min(4, w)), Math.max(1, Math.min(8, h)) };
    }

    private String previa(AppWidgetProviderInfo p) {
        try {
            Drawable d = p.loadPreviewImage(getContext(), 0);
            if (d == null) d = p.loadIcon(getContext(), 0);
            if (d == null) return null;
            int w = Math.max(1, d.getIntrinsicWidth()), h = Math.max(1, d.getIntrinsicHeight());
            float k = Math.min(1f, 360f / Math.max(w, h));
            int lw = Math.max(1, Math.round(w * k)), lh = Math.max(1, Math.round(h * k));
            Bitmap b = Bitmap.createBitmap(lw, lh, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, lw, lh);
            d.draw(c);
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 90, o);
            b.recycle();
            return Base64.encodeToString(o.toByteArray(), Base64.NO_WRAP);
        } catch (Throwable e) {
            return null;
        }
    }

    /** Lista os widgets dos apps instalados, com prévia e tamanho. */
    @PluginMethod
    public void listar(PluginCall call) {
        new Thread(() -> {
            try {
                JSArray lista = new JSArray();
                for (AppWidgetProviderInfo p : gerente.getInstalledProviders()) {
                    if (p.provider == null) continue;
                    if (getContext().getPackageName().equals(p.provider.getPackageName())) continue;
                    JSObject o = new JSObject();
                    o.put("provider", chave(p.provider));
                    o.put("pacote", p.provider.getPackageName());
                    String app = "";
                    try { app = String.valueOf(getContext().getPackageManager().getApplicationLabel(getContext().getPackageManager().getApplicationInfo(p.provider.getPackageName(), 0))); } catch (Exception ignora) { }
                    o.put("app", app);
                    String nome = "";
                    try { nome = p.loadLabel(getContext().getPackageManager()); } catch (Throwable ignora) { }
                    o.put("nome", nome == null ? "" : nome);
                    int[] c = celulas(p);
                    o.put("w", c[0]);
                    o.put("h", c[1]);
                    String pv = previa(p);
                    if (pv != null) o.put("previa", pv);
                    lista.put(o);
                }
                JSObject r = new JSObject();
                r.put("widgets", lista);
                call.resolve(r);
            } catch (Throwable e) {
                call.reject("Não consegui listar os widgets.");
            }
        }).start();
    }

    /** Cria o widget: reserva o número, pede permissão do Android se preciso e abre a tela de ajustes do widget, se ele tiver. */
    @PluginMethod
    public void criar(PluginCall call) {
        ComponentName c = componente(call.getString("provider"));
        AppWidgetProviderInfo info = c == null ? null : achar(c);
        if (info == null) { call.reject("Esse widget não está mais instalado."); return; }
        int id;
        try { id = host.allocateAppWidgetId(); } catch (Throwable e) { call.reject("Não consegui reservar o widget."); return; }
        boolean ok = false;
        try { ok = gerente.bindAppWidgetIdIfAllowed(id, c); } catch (Throwable ignora) { }
        call.getData().put("_id", id);
        if (ok) { depoisDeLigar(call, id, info); return; }
        Intent i = new Intent(AppWidgetManager.ACTION_APPWIDGET_BIND);
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_PROVIDER, c);
        startActivityForResult(call, i, "aoLigar");
    }

    @ActivityCallback
    private void aoLigar(PluginCall call, ActivityResult r) {
        if (call == null) return;
        int id = call.getData().optInt("_id", -1);
        if (r.getResultCode() != Activity.RESULT_OK) { liberar(id); call.reject("Você não permitiu esse widget."); return; }
        ComponentName c = componente(call.getString("provider"));
        AppWidgetProviderInfo info = c == null ? null : achar(c);
        if (info == null) { liberar(id); call.reject("Esse widget não está mais instalado."); return; }
        depoisDeLigar(call, id, info);
    }

    private void depoisDeLigar(PluginCall call, int id, AppWidgetProviderInfo info) {
        if (info.configure == null) { terminar(call, id, info); return; }
        Intent i = new Intent(AppWidgetManager.ACTION_APPWIDGET_CONFIGURE);
        i.setComponent(info.configure);
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        try {
            startActivityForResult(call, i, "aoConfigurar");
        } catch (Throwable e) {
            terminar(call, id, info); // sem tela de ajustes: usa o widget do jeito que vem
        }
    }

    @ActivityCallback
    private void aoConfigurar(PluginCall call, ActivityResult r) {
        if (call == null) return;
        int id = call.getData().optInt("_id", -1);
        if (r.getResultCode() != Activity.RESULT_OK) { liberar(id); call.reject("Configuração cancelada."); return; }
        ComponentName c = componente(call.getString("provider"));
        AppWidgetProviderInfo info = c == null ? null : achar(c);
        if (info == null) { liberar(id); call.reject("Esse widget não está mais instalado."); return; }
        terminar(call, id, info);
    }

    private void terminar(PluginCall call, int id, AppWidgetProviderInfo info) {
        int[] c = celulas(info);
        JSObject r = new JSObject();
        r.put("id", id);
        r.put("w", c[0]);
        r.put("h", c[1]);
        call.resolve(r);
    }

    private void liberar(int id) {
        if (id < 0) return;
        try { host.deleteAppWidgetId(id); } catch (Throwable ignora) { }
    }

    /** Tira o widget da tela e devolve o número ao Android. */
    @PluginMethod
    public void remover(PluginCall call) {
        final int id = call.getInt("id", -1);
        getActivity().runOnUiThread(() -> {
            Envoltorio v = vistas.remove(id);
            if (v != null && camada != null) camada.removeView(v);
            liberar(id);
            call.resolve();
        });
    }

    /**
     * Posiciona os widgets reais. Cada item: id, x, y, w, h (retângulo do widget, em px CSS) e cx, cy, cw, ch (parte visível
     * dele, já cortada pela rolagem). Ids que não vêm na lista saem da tela (mas continuam existindo).
     */
    @PluginMethod
    public void mostrar(PluginCall call) {
        final JSArray itens = call.getArray("itens", new JSArray());
        final float d = densidade();
        getActivity().runOnUiThread(() -> {
            try {
                garantirCamada();
                java.util.HashSet<Integer> presentes = new java.util.HashSet<>();
                JSObject estados = new JSObject();
                for (int k = 0; k < itens.length(); k++) {
                    JSONObject o = itens.getJSONObject(k);
                    int id = o.getInt("id");
                    double x = o.getDouble("x"), y = o.getDouble("y"), w = o.getDouble("w"), h = o.getDouble("h");
                    double cx = o.getDouble("cx"), cy = o.getDouble("cy"), cw = o.getDouble("cw"), ch = o.getDouble("ch");
                    if (w < 8 || h < 8 || cw < 2 || ch < 2) continue;
                    Envoltorio v = vistas.get(id);
                    if (v == null) {
                        v = criarVista(id);
                        if (v == null) { estados.put(String.valueOf(id), erroVista); continue; }
                        vistas.put(id, v);
                        camada.addView(v);
                    }
                    presentes.add(id);
                    int lw = Math.round((float) (w * d)), lh = Math.round((float) (h * d));
                    FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) v.getLayoutParams();
                    if (lp == null || lp.width != lw || lp.height != lh || lp.leftMargin != Math.round((float) (x * d)) || lp.topMargin != Math.round((float) (y * d))) {
                        lp = new FrameLayout.LayoutParams(lw, lh);
                        lp.leftMargin = Math.round((float) (x * d));
                        lp.topMargin = Math.round((float) (y * d));
                        v.setLayoutParams(lp);
                        try { v.filho.updateAppWidgetSize(null, (int) w, (int) h, (int) w, (int) h); } catch (Throwable ignora) { }
                    }
                    Rect corte = new Rect(Math.round((float) ((cx - x) * d)), Math.round((float) ((cy - y) * d)), Math.round((float) ((cx - x + cw) * d)), Math.round((float) ((cy - y + ch) * d)));
                    v.setClipBounds(corte);
                    v.setVisibility(View.VISIBLE);
                    String f = v.falha();
                    if (f != null) { v.setVisibility(View.INVISIBLE); estados.put(String.valueOf(id), "Android recusou desenhar: " + f); }
                    else estados.put(String.valueOf(id), v.desenhado() ? "ok" : "aguardando");
                }
                for (Map.Entry<Integer, Envoltorio> e : vistas.entrySet()) if (!presentes.contains(e.getKey())) e.getValue().setVisibility(View.GONE);
                JSObject r = new JSObject();
                r.put("estados", estados);
                call.resolve(r);
            } catch (Throwable e) {
                call.reject("Não consegui mostrar os widgets: " + e.getClass().getSimpleName());
            }
        });
    }

    private void garantirCamada() {
        if (camada != null && camada.getParent() != null) return;
        ViewGroup raiz = getActivity().findViewById(android.R.id.content);
        camada = new FrameLayout(getContext());
        camada.setClipChildren(false);
        camada.setLayoutParams(new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        raiz.addView(camada);
        // a camada fica sem fundo: só os widgets recebem toque; o resto atravessa para a WebView
    }


    /** Vista do widget que anota por que o Android não conseguiu desenhar (o texto "Não foi possível adicionar widget"). */
    private static class Vista extends AppWidgetHostView {
        volatile String falha = null;
        RemoteViews ultimo = null;
        private AppWidgetProviderInfo info = null;
        /** Pede ao app dono do widget que mande o desenho de novo; quem cria a vista preenche. */
        Runnable pedirDeNovo = null;
        private int pedidos = 0;

        /**
         * O widget é desenhado com o tema padrão do Android (DeviceDefault), não com o tema do nosso app: vários widgets usam
         * atributos desse tema para medir e pintar (ex.: ?android:attr/...). Com o tema errado o Android diz "You must supply a
         * layout_height attribute" e o widget não aparece. O contexto base é o do APLICATIVO e não o da tela (AppCompat): o inflador da tela
         * tem a fábrica do AppCompat, que troca ImageView por AppCompatImageView e o RemoteViews recusa ("can't use method with
         * RemoteViews: setImageBitmap"); o inflador do aplicativo não tem essa fábrica.
         */
        Vista(Context c) { super(new android.view.ContextThemeWrapper(c.getApplicationContext(), android.R.style.Theme_DeviceDefault_DayNight)); }

        @Override public void setAppWidget(int id, AppWidgetProviderInfo i) { info = i; super.setAppWidget(id, i); }

        @Override public void updateAppWidget(RemoteViews rv) {
            ultimo = rv;
            falha = null;
            super.updateAppWidget(rv);
        }

        @Override protected View getErrorView() {
            falha = descobrir();
            // enquanto o app do widget não mandou o desenho, o Android mostra a tela de erro do desenho inicial: pede de novo
            // (até 6 vezes, a cada 2,5 s) e, quando o desenho chegar, ele substitui esta tela sozinho
            if (ultimo == null && pedirDeNovo != null && pedidos < 6) {
                pedidos++;
                postDelayed(pedirDeNovo, 2500);
            }
            return super.getErrorView();
        }

        /** Repete a montagem à parte só para pegar o erro de verdade (o Android esconde). */
        private String descobrir() {
            try {
                if (ultimo != null) {
                    String nome = "";
                    try { nome = " [" + ultimo.getPackage() + ":" + getContext().createPackageContext(ultimo.getPackage(), 0).getResources().getResourceEntryName(ultimo.getLayoutId()) + "]"; } catch (Throwable ignora) { }
                    try { ultimo.apply(getContext(), new FrameLayout(getContext())); return "O widget mandou um desenho que o Android não conseguiu montar" + nome + "."; }
                    catch (Throwable e) { Throwable r = e; while (r.getCause() != null && r.getCause() != r) r = r.getCause(); String m = r.getClass().getSimpleName() + (r.getMessage() == null ? "" : ": " + r.getMessage()); return (m.length() > 120 ? m.substring(0, 120) : m) + nome; }
                }
                // sem desenho ainda: o erro do desenho inicial do app não é o problema de verdade, é só a espera
                return "Esperando o app do widget mandar o desenho (" + (info == null ? "?" : info.provider.getPackageName()) + "). Se não aparecer, abra esse app uma vez e adicione o widget de novo.";
            } catch (Throwable e) {
                Throwable raiz = e;
                while (raiz.getCause() != null && raiz.getCause() != raiz) raiz = raiz.getCause();
                String m = raiz.getClass().getSimpleName() + (raiz.getMessage() == null ? "" : ": " + raiz.getMessage());
                return m.length() > 160 ? m.substring(0, 160) : m;
            }
        }
    }

    private String erroVista = "";

    /** Pede ao app dono do widget que desenhe de novo (resolve o "Não foi possível adicionar widget" de widgets que ficaram sem atualização). */
    private void pedirAtualizacao(int id, AppWidgetProviderInfo info) {
        try {
            Intent u = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            u.setComponent(info.provider);
            u.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, new int[] { id });
            getContext().sendBroadcast(u);
        } catch (Throwable ignora) { }
    }

    private Envoltorio criarVista(int id) {
        try {
            AppWidgetProviderInfo info = gerente.getAppWidgetInfo(id);
            if (info == null) { erroVista = "O Android não reconhece mais este widget (o app dele foi removido ou atualizado). Remova e adicione de novo."; return null; }
            AppWidgetHostView hv = host.createView(getContext().getApplicationContext(), id, info);
            hv.setAppWidget(id, info);
            if (hv instanceof Vista) ((Vista) hv).pedirDeNovo = () -> pedirAtualizacao(id, info);
            iniciarEscuta();
            pedirAtualizacao(id, info);
            return new Envoltorio(getContext(), id, hv);
        } catch (Throwable e) {
            erroVista = "Não consegui abrir este widget (" + e.getClass().getSimpleName() + "). Remova e adicione de novo.";
            return null;
        }
    }

    /** Segurar abre a edição; arrastar na vertical rola a tela do V-Space; o resto vai para o widget. */
    private class Envoltorio extends FrameLayout {
        final int id;
        final AppWidgetHostView filho;
        String falha() { return filho instanceof Vista ? ((Vista) filho).falha : null; }
        /** Só vale "ok" depois que o app dono do widget mandou o desenho de verdade; antes disso a tela mostra o aviso de espera. */
        boolean desenhado() { return filho instanceof Vista && ((Vista) filho).ultimo != null; }
        private final GestureDetector gesto;
        private final int folga;
        private float y0, ultimoY;
        private boolean rolando = false;

        Envoltorio(Context c, int id, AppWidgetHostView filho) {
            super(c);
            this.id = id;
            this.filho = filho;
            this.folga = ViewConfiguration.get(c).getScaledTouchSlop();
            addView(filho, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            gesto = new GestureDetector(c, new GestureDetector.SimpleOnGestureListener() {
                @Override public void onLongPress(MotionEvent e) {
                    JSObject o = new JSObject();
                    o.put("id", Envoltorio.this.id);
                    notifyListeners("widgetLongo", o);
                }
            });
        }

        @Override
        public boolean onInterceptTouchEvent(MotionEvent e) {
            gesto.onTouchEvent(e);
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN: y0 = e.getY(); ultimoY = y0; rolando = false; break;
                case MotionEvent.ACTION_MOVE:
                    if (!rolando && Math.abs(e.getY() - y0) > folga) { rolando = true; ultimoY = e.getY(); return true; }
                    break;
                default: break;
            }
            return false;
        }

        @Override
        public boolean onTouchEvent(MotionEvent e) {
            gesto.onTouchEvent(e);
            if (e.getActionMasked() == MotionEvent.ACTION_MOVE && rolando) {
                float dy = (ultimoY - e.getY()) / densidade();
                ultimoY = e.getY();
                JSObject o = new JSObject();
                o.put("dy", dy);
                notifyListeners("widgetRolar", o);
            }
            if (e.getActionMasked() == MotionEvent.ACTION_UP || e.getActionMasked() == MotionEvent.ACTION_CANCEL) rolando = false;
            return true;
        }
    }
}
