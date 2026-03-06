// shared/CosmeticRenderer.js
// Shared cosmetic rendering utility for portal and arcade
// Replaces ProfileCustomization.js rendering methods

window.CosmeticRenderer = {
  /**
   * Render a cosmetic icon — detects emoji vs filename
   * @param {string} icon - Emoji character or asset filename
   * @param {string} category - avatar, title, badge
   * @param {number} size - Pixel size
   * @returns {string} HTML string
   */
  renderIcon(icon, category, size = 24) {
    if (!icon) return `<span style="font-size:${size}px">🎨</span>`;
    const firstCode = icon.codePointAt(0);
    if (firstCode > 0xFF || icon.length <= 2) {
      return `<span style="font-size:${size}px">${icon}</span>`;
    }
    const folder = category.endsWith('s') ? category : category + 's';
    return `<img src="assets/cosmetics/${folder}/${icon}.svg" style="width:${size}px;height:${size}px;object-fit:contain;" onerror="this.onerror=function(){this.outerHTML='<span style=\\'font-size:${size}px\\'>🎨</span>'};this.src='assets/cosmetics/${folder}/${icon}.png'">`;
  },

  /**
   * Render a player identity block (avatar + title + name + badges)
   * @param {Object} cosmetics - { avatar, title, badge1, badge2, badge3 } each with { icon, name }
   * @param {string} name - Display name
   * @param {Object} opts - { avatarSize, badgeSize, showBadges }
   * @returns {string} HTML string
   */
  renderPlayerIdentity(cosmetics, name, opts = {}) {
    const { avatarSize = 40, badgeSize = 18, showBadges = true } = opts;
    const cos = cosmetics || {};

    const avatarIcon = cos.avatar
      ? this.renderIcon(cos.avatar.icon, 'avatar', avatarSize)
      : `<span style="font-size:${avatarSize}px">👤</span>`;

    const titleHtml = cos.title
      ? `<span style="font-size:11px;color:#9b59b6;font-weight:600;">${cos.title.name}</span>`
      : '';

    let badgesHtml = '';
    if (showBadges) {
      ['badge1', 'badge2', 'badge3'].forEach(slot => {
        if (cos[slot]) {
          badgesHtml += `<span title="${cos[slot].name}">${this.renderIcon(cos[slot].icon, 'badge', badgeSize)}</span>`;
        }
      });
    }

    return `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:${avatarSize}px;height:${avatarSize}px;border-radius:50%;background:var(--surface-2,#27272a);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${avatarIcon}</div>
        <div>
          ${titleHtml}
          <div style="font-weight:600;">${name}</div>
          ${badgesHtml ? `<div style="display:flex;gap:4px;margin-top:2px;">${badgesHtml}</div>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Format display name with title prefix
   * @param {string} name - Base display name
   * @param {string} titleName - Title name (or null)
   * @returns {string}
   */
  formatDisplayName(name, titleName) {
    if (titleName) return `${titleName} ${name}`;
    return name;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CosmeticRenderer: window.CosmeticRenderer };
}
