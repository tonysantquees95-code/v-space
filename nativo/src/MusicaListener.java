package tech.vetorial.vspace;

import android.service.notification.NotificationListenerService;

/**
 * Serviço vazio: só existir (e a pessoa liberar o acesso às notificações) já permite ao V-Space ver o que está tocando
 * (MediaSessionManager). Ele não lê nem guarda nenhuma notificação.
 */
public class MusicaListener extends NotificationListenerService {
}
