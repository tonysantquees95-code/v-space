package tech.vetorial.vspace;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/** Tela principal do V-Space: o launcher ocupa a tela inteira (por trás das barras) e nunca fecha com o "voltar". */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VSpacePlugin.class);
        registerPlugin(AtualizadorPlugin.class);
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        WindowCompat.setDecorFitsSystemWindows(w, false);
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        w.getDecorView().setBackgroundColor(Color.parseColor("#05070D"));
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
        c.setAppearanceLightStatusBars(false);
        c.setAppearanceLightNavigationBars(false);
        // O app fica ENTRE a barra de notificações e a de navegação (fixas ou não): o conteúdo ganha margem do tamanho das barras.
        final View conteudo = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(conteudo, (v, insets) -> {
            Insets b = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(conteudo);
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
