// Only the configured Shopify store may receive checkout navigation.
document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  const url = new URL(link.href, location.href);
  if (url.protocol === 'mailto:' && url.pathname === 'info@uksmeg.store') return;
  if (url.protocol === 'https:' && url.hostname === window.SHOPIFY_CATALOG.domain) return;
  if (url.origin !== location.origin || (url.pathname !== '/' && url.pathname !== '/local-checkout.html' && !url.pathname.startsWith('/assets/'))) {
    event.preventDefault();
    showLocalNotice('Este destino depende da loja original e não está incluído nesta cópia local.');
  }
}, true);
document.addEventListener('submit', event => {
  if (event.target.querySelector('#addToCart') || event.target.querySelector('#basketCheckout')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showLocalNotice('Demonstração local: nenhum formulário foi enviado.');
}, true);
function showLocalNotice(message) {
  let dialog = document.querySelector('#localNotice');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'localNotice';
    dialog.style.cssText = 'max-width:440px;padding:28px;border:1px solid #ddd;border-radius:12px;font:16px system-ui;';
    const title = document.createElement('h2'); title.textContent = 'Cópia local';
    const text = document.createElement('p');
    const close = document.createElement('button'); close.textContent = 'Fechar'; close.addEventListener('click',()=>dialog.close());
    dialog.append(title,text,close); document.body.append(dialog);
  }
  dialog.querySelector('p').textContent = message;
  dialog.showModal();
}
