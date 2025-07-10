// timepicker.js
// Custom Time Picker Component
(function(){
  // Helper: pad numbers
  function pad(n) { return n < 10 ? '0' + n : n; }

  // Format time as hh:mm AM/PM
  function formatTime(h, m, ampm) {
    return pad(h) + ':' + pad(m) + ' ' + ampm;
  }

  // Parse time string to Date object (today's date)
  function parseTimeToDate(h, m, ampm) {
    let hour = parseInt(h, 10);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const d = new Date();
    d.setHours(hour, m, 0, 0);
    return d;
  }

  // Main TimePicker class
  class TimePicker {
    constructor(input, options={}) {
      this.input = input;
      this.options = options;
      this.value = null;
      this.dropdown = null;
      this.isOpen = false;
      this._init();
    }
    _init() {
      // Only set value if input has a value (for backward compatibility)
      if (this.input.value) {
        // Try to parse value (not implemented here)
        // For now, fallback to current time
        const now = new Date();
        let h = now.getHours();
        let m = now.getMinutes();
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        m = Math.round(m/5)*5; // Snap to nearest 5 min
        this.value = { h, m, ampm };
        this.input.value = formatTime(h, m, ampm);
      } else {
        this.value = null;
        this.input.value = '';
      }
      this.input.readOnly = true;
      this.input.classList.add('tp-input');
      this.input.addEventListener('click', () => this.open());
      this.input.addEventListener('keydown', e => this._onInputKey(e));
    }
    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this._renderDropdown();
    }
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      if (this.dropdown) {
        this.dropdown.classList.remove('tp-open');
        setTimeout(() => {
          if (this.dropdown) this.dropdown.remove();
          this.dropdown = null;
        }, 180);
      }
      document.removeEventListener('mousedown', this._onDocClick);
      document.removeEventListener('keydown', this._onDocKey);
    }
    _renderDropdown() {
      // Remove any existing dropdown
      if (this.dropdown) this.dropdown.remove();
      const rect = this.input.getBoundingClientRect();
      const dropdown = document.createElement('div');
      dropdown.className = 'tp-dropdown';
      dropdown.tabIndex = -1;
      // Build hour, minute, am/pm columns
      const hourCol = document.createElement('div');
      hourCol.className = 'tp-col';
      for (let h = 1; h <= 12; h++) {
        const btn = document.createElement('button');
        btn.className = 'tp-btn tp-hour';
        btn.textContent = pad(h);
        if (this.value && h === this.value.h) btn.classList.add('tp-selected');
        btn.addEventListener('click', () => this._setHour(h));
        hourCol.appendChild(btn);
      }
      const minCol = document.createElement('div');
      minCol.className = 'tp-col';
      for (let m = 0; m < 60; m += 5) {
        const btn = document.createElement('button');
        btn.className = 'tp-btn tp-min';
        btn.textContent = pad(m);
        if (this.value && m === this.value.m) btn.classList.add('tp-selected');
        btn.addEventListener('click', () => this._setMin(m));
        minCol.appendChild(btn);
      }
      const ampmCol = document.createElement('div');
      ampmCol.className = 'tp-col';
      ['AM','PM'].forEach(ampm => {
        const btn = document.createElement('button');
        btn.className = 'tp-btn tp-ampm';
        btn.textContent = ampm;
        if (this.value && ampm === this.value.ampm) btn.classList.add('tp-selected');
        btn.addEventListener('click', () => this._setAMPM(ampm));
        ampmCol.appendChild(btn);
      });
      dropdown.appendChild(hourCol);
      dropdown.appendChild(minCol);
      dropdown.appendChild(ampmCol);
      // Position dropdown
      dropdown.style.position = 'absolute';
      dropdown.style.left = rect.left + 'px';
      dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      dropdown.style.zIndex = 10000;
      document.body.appendChild(dropdown);
      setTimeout(() => dropdown.classList.add('tp-open'), 10);
      this.dropdown = dropdown;
      // Focus first selected, or first hour if no value
      setTimeout(() => {
        let sel = dropdown.querySelector('.tp-selected');
        if (!sel) sel = dropdown.querySelector('.tp-hour');
        if (sel) sel.focus();
      }, 30);
      // Outside click/Esc
      this._onDocClick = (e) => {
        if (!dropdown.contains(e.target) && e.target !== this.input) this.close();
      };
      this._onDocKey = (e) => {
        if (e.key === 'Escape') this.close();
      };
      document.addEventListener('mousedown', this._onDocClick);
      document.addEventListener('keydown', this._onDocKey);
      // Keyboard navigation
      dropdown.addEventListener('keydown', e => this._onDropdownKey(e));
    }
    _setHour(h) {
      if (!this.value) this.value = { h: h, m: 0, ampm: 'AM' };
      this.value.h = h;
      if (this.value.m == null) this.value.m = 0;
      if (!this.value.ampm) this.value.ampm = 'AM';
      this._updateSelected('hour', h);
      this._updateInput();
    }
    _setMin(m) {
      if (!this.value) this.value = { h: 12, m: m, ampm: 'AM' };
      this.value.m = m;
      if (this.value.h == null) this.value.h = 12;
      if (!this.value.ampm) this.value.ampm = 'AM';
      this._updateSelected('min', m);
      this._updateInput();
    }
    _setAMPM(ampm) {
      if (!this.value) this.value = { h: 12, m: 0, ampm: ampm };
      this.value.ampm = ampm;
      if (this.value.h == null) this.value.h = 12;
      if (this.value.m == null) this.value.m = 0;
      this._updateSelected('ampm', ampm);
      this._updateInput();
    }
    _updateSelected(type, value) {
      if (!this.dropdown) return;
      let selector = '';
      if (type === 'hour') selector = '.tp-hour';
      if (type === 'min') selector = '.tp-min';
      if (type === 'ampm') selector = '.tp-ampm';
      const btns = this.dropdown.querySelectorAll(selector);
      btns.forEach(btn => {
        if (btn.textContent === pad(value) || btn.textContent === value) {
          btn.classList.add('tp-selected');
        } else {
          btn.classList.remove('tp-selected');
        }
      });
    }
    _updateInput() {
      if (this.value && this.value.h && this.value.m != null && this.value.ampm) {
        this.input.value = formatTime(this.value.h, this.value.m, this.value.ampm);
      } else {
        this.input.value = '';
      }
      if (this.options.onChange) {
        this.options.onChange(this.getDate(), this.getFormatted());
      }
      // Do NOT re-render dropdown here, just update .tp-selected
    }
    _onInputKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.open();
      }
    }
    _onDropdownKey(e) {
      // Arrow navigation between columns/buttons
      const focusable = Array.from(this.dropdown.querySelectorAll('.tp-btn'));
      let idx = focusable.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx >= 0 && idx < focusable.length-1) focusable[idx+1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) focusable[idx-1].focus();
      } else if (e.key === 'Tab') {
        // Allow tab to next/prev column
        // Let browser handle
      } else if (e.key === 'Escape') {
        this.close();
      }
    }
    getDate() {
      if (!this.value) return null;
      return parseTimeToDate(this.value.h, this.value.m, this.value.ampm);
    }
    getFormatted() {
      if (!this.value) return '';
      return formatTime(this.value.h, this.value.m, this.value.ampm);
    }
  }
  // Expose globally
  window.TimePicker = TimePicker;
})(); 