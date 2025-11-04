// deno-lint-ignore-file

const onceModal = (html, onReady = null, onHidden = null) => {
    const m = document.createElement('div');
    m.className = 'modal fade';
    m.tabIndex = -1;
    m.innerHTML = html;
    document.body.appendChild(m);
    const ins = new bootstrap.Modal(m);
    m.addEventListener('hidden.bs.modal', () => { m.remove(); onHidden?.(); });
    if (onReady) onReady(ins, m);
    ins.show();
    return ins;
};

const upload = async () => {
    const f = file.files[0];
    if (!f) return;

    const loading = onceModal(`
    <div class="modal-dialog modal-sm">
      <div class="modal-content text-center p-3">
        <div class="spinner-border text-primary mb-2"></div>
        <div>Uploading...</div>
      </div>
    </div>`);

    const body = new FormData();
    body.append('file', f);

    try {
        const res = await fetch('/api/upload', { method: 'POST', body });
        const msg = await res.text();
        loading.hide();
        onceModal(`
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Upload result</h5></div>
          <div class="modal-body">${msg}</div>
          <div class="modal-footer">
            <button class="btn btn-primary" data-bs-dismiss="modal">OK</button>
          </div>
        </div>
      </div>`, null, () => location.reload());
    } catch {
        loading.hide();
        onceModal(`
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Upload failed</h5></div>
          <div class="modal-body">Something went wrong, please try again.</div>
          <div class="modal-footer">
            <button class="btn btn-primary" data-bs-dismiss="modal">OK</button>
          </div>
        </div>
      </div>`);
    }
};

const delFile = async (filename) => {
    let ok = false;
    const confirm = onceModal(`
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Confirm delete</h5></div>
        <div class="modal-body">Delete <strong>${filename}</strong>?</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-danger" id="delYes">Delete</button>
        </div>
      </div>
    </div>`, (ins, m) => {
        m.querySelector('#delYes').addEventListener('click', () => { ok = true; ins.hide(); });
    });

    await new Promise(r => confirm._element.addEventListener('hidden.bs.modal', r));
    if (!ok) return;

    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`, { method: 'DELETE' });
    const msg = await res.text();

    onceModal(`
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Result</h5></div>
        <div class="modal-body">${msg}</div>
        <div class="modal-footer">
          <button class="btn btn-primary" data-bs-dismiss="modal">OK</button>
        </div>
      </div>
    </div>`, null, () => location.reload());
};