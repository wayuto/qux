// deno-lint-ignore-file
const uploadTrigger = () => document.getElementById('file').click();

const setPass = async () => {
  const modalEl = document.getElementById('passModal');
  const modal = new bootstrap.Modal(modalEl);
  const input = document.getElementById('newPassInput');
  input.value = '';
  modal.show();

  document.getElementById('confirmSetPass').onclick = async () => {
    const password = input.value.trim();
    if (!password) return;
    modal.hide();

    const res = await fetch('/api/setPass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const msg = await res.text();

    document.getElementById('toastMsg').textContent = msg;
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
  };

  input.addEventListener('keyup', e => {
    if (e.key === 'Enter') document.getElementById('confirmSetPass').click();
  });
};

const connect = () => {
  const modal = new bootstrap.Modal(document.getElementById('ipModal'));
  modal.show();

  document.getElementById('confirmConnect').onclick = () => {
    const ip = document.getElementById('remoteIP').value.trim();
    if (!ip) return;
    modal.hide();
    window.location.href = `/others?ip=${encodeURIComponent(ip)}`;
  };

  document.getElementById('remoteIP').addEventListener('keyup', e => {
    if (e.key === 'Enter') document.getElementById('confirmConnect').click();
  });
};