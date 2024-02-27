import React, { useEffect, useState } from "react";

export default function CookieConsentPage({ onConsent }:any) {
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    const cookiePermission = localStorage.getItem("cookiePermission");
    if (!cookiePermission) {
      // Se a permissão não foi dada ainda, mostra a notificação
      setConsentGiven(false);
    } else {
      // Se a permissão já foi dada anteriormente, não mostra a notificação
      setConsentGiven(true);
    }
  }, []);

  const handleConsent = (consent:any) => {
    // Salva a preferência do usuário no localStorage
    localStorage.setItem("cookiePermission", consent ? "granted" : "denied");
    // Informa ao componente pai que a permissão foi dada ou negada
    onConsent(consent);
    // Atualiza o estado para esconder a notificação
    setConsentGiven(true);
  };

  return (
    <div style={{ display: consentGiven ? "none" : "block" }}>
      <h2>Permissão de Cookies</h2>
      <p>
        Este site utiliza cookies para melhorar a sua experiência. Aceita o uso
        de cookies?
      </p>
      <button onClick={() => handleConsent(true)}>Aceitar</button>
      <button onClick={() => handleConsent(false)}>Recusar</button>
    </div>
  );
}
