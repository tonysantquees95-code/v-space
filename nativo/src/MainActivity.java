package tech.vetorial.vspace;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.os.Handler;
import android.os.Looper;
import android.view.Window;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/** Tela principal do V-Space: o launcher ocupa a tela inteira (por trás das barras) e nunca fecha com o "voltar". */
public class MainActivity extends BridgeActivity {
    /** Tamanho das barras do sistema em dp: topo, base, esquerda, direita. A tela web usa para não deixar nada embaixo delas. */
    public static volatile float[] barrasDp = new float[] {0, 0, 0, 0, 0};

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VSpacePlugin.class);
        registerPlugin(AtualizadorPlugin.class);
        registerPlugin(WidgetsPlugin.class);
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        WindowCompat.setDecorFitsSystemWindows(w, false);
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        w.getDecorView().setBackgroundColor(Color.parseColor("#05070D"));
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
        c.setAppearanceLightStatusBars(false);
        c.setAppearanceLightNavigationBars(false);
        // O fundo aparece por trás das barras (tela única), mas o conteúdo fica ENTRE elas: a tela web recebe o tamanho
        // das barras e afasta o que é tocável (--barra-topo / --barra-base).
        final View conteudo = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(conteudo, (v, insets) -> {
            Insets b = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float d = getResources().getDisplayMetrics().density;
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            barrasDp = new float[] {b.top / d, b.bottom / d, b.left / d, b.right / d, ime.bottom / d};
            v.setPadding(0, 0, 0, 0);
            try { getBridge().triggerWindowJSEvent("vspacebarras"); } catch (Exception ignora) { }
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(conteudo);
    }

    private final Handler relogio = new Handler(Looper.getMainLooper());
    private int tentativas = 0;

    /** Depois de atualizar por dentro, abrir pelo instalador às vezes deixa a tela preta. Se a tela web não avisar que está
     *  pronta em poucos segundos, recarrega a tela sozinha (até 3 vezes) e, no fim, recria a janela. */
    @Override
    public void onResume() {
        super.onResume();
        tentativas = 0;
        agendarConferencia(2500);
    }

    @Override
    public void onPause() {
        relogio.removeCallbacksAndMessages(null);
        super.onPause();
    }

    private void agendarConferencia(long ms) {
        relogio.removeCallbacksAndMessages(null);
        relogio.postDelayed(() -> {
            try {
                final WebView wv = getBridge().getWebView();
                wv.evaluateJavascript("(function(){return window.__vspacePronto===true;})()", valor -> {
                    if ("true".equals(valor)) return;
                    tentativas++;
                    if (tentativas == 1 || tentativas == 2) { try { wv.reload(); } catch (Exception ignora) { } agendarConferencia(3500); }
                    else if (tentativas == 3) { recreate(); }
                });
            } catch (Exception ignora) { }
        }, ms);
    }

    /** Apertar o botão início com o V-Space já aberto: avisa a tela para fechar janelas e voltar à primeira página. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && Intent.ACTION_MAIN.equals(intent.getAction()) && intent.hasCategory(Intent.CATEGORY_HOME)) {
            try { getBridge().triggerWindowJSEvent("vspaceinicio"); } catch (Exception ignora) { }
        }
    }
}
