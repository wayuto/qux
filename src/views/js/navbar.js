// deno-lint-ignore-file

const template = document.createElement('template');
template.innerHTML = `
<input id="file" type="file" style="display: none" onchange="upload()" />

<div class="modal fade" id="passModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-dark text-light">
      <div class="modal-header border-secondary">
        <h5 class="modal-title">Set new password</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="form-floating">
          <input type="password" class="form-control" id="newPassInput" placeholder="Password">
          <label for="newPassInput">New password</label>
        </div>
      </div>
      <div class="modal-footer border-secondary">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" id="confirmSetPass">OK</button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="ipModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-dark text-light">
      <div class="modal-header border-secondary">
        <h5 class="modal-title">Download from remote host</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="form-floating">
          <input type="text" class="form-control" id="remoteIP" placeholder="192.168.1.100">
          <label for="remoteIP">Target IP</label>
        </div>
      </div>
      <div class="modal-footer border-secondary">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" id="confirmConnect">Connect</button>
      </div>
    </div>
  </div>
</div>

<nav class="navbar navbar-expand bg-primary fixed-top" data-bs-theme="dark">
  <div class="container">
  <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
    <div id="successToast" class="toast bg-dark text-light" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="2000">
      <div class="toast-header bg-secondary text-light">
        <strong class="me-auto">Success</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body" id="toastMsg"></div>
    </div>
  </div>
    <a class="navbar-brand" href="#" onclick="setPass()">Qux</a>
    <ul class="navbar-nav">
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">Files</a>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="#" onclick="uploadTrigger()">Upload</a>
          <a class="dropdown-item" href="#" onclick="connect()">Download</a>
        </div>
      </li>
    </ul>
  </div>
</nav>
`;

class NavBar extends HTMLElement {
  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
  }
}
customElements.define('nav-bar', NavBar);

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