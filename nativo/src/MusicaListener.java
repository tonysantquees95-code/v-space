package tech.vetorial.vspace;

import android.app.Notification;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.HashMap;
import java.util.Map;

/**
 * Com o acesso às notificações liberado, o V-Space (1) vê o que está tocando (MediaSessionManager) e (2) conta quantas
 * notificações cada app tem para mostrar o selo no ícone. Só a CONTAGEM por app é usada: o texto das notificações nunca é lido nem guardado.
 */
public class MusicaListener extends NotificationListenerService {
    private static volatile MusicaListener instancia;

    @Override public void onListenerConnected() { instancia = this; }
    @Override public void onListenerDisconnected() { if (instancia == this) instancia = null; }
    @Override public void onDestroy() { if (instancia == this) instancia = null; super.onDestroy(); }

    /** Pacote → quantidade de notificações (ignora as fixas do sistema, as de música e os resumos de grupo). */
    public static Map<String, Integer> contar() {
        Map<String, Integer> r = new HashMap<>();
        MusicaListener l = instancia;
        if (l == null) return r;
        try {
            StatusBarNotification[] todas = l.getActiveNotifications();
            if (todas == null) return r;
            for (StatusBarNotification s : todas) {
                Notification n = s.getNotification();
                if (n == null) continue;
                if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) continue;
                if ((n.flags & Notification.FLAG_ONGOING_EVENT) != 0) continue;
                if (Notification.CATEGORY_TRANSPORT.equals(n.category)) continue;
                String p = s.getPackageName();
                r.put(p, r.getOrDefault(p, 0) + 1);
            }
        } catch (Throwable ignora) { }
        return r;
    }
}
