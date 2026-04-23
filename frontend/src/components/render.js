export function renderHelpSections(helpSections) {
  return helpSections
    .map(
      (section) => `
        <article class="help-card">
          <h3>${section.title}</h3>
          <p>${section.body}</p>
        </article>
      `,
    )
    .join('');
}

export function renderButtonCards(labels) {
  return Object.entries(labels)
    .map(
      ([key, value]) => `
        <div class="button-card" data-button-card="${key}">
          <span class="button-card__label">${key}</span>
          <strong data-button-value="${key}">${value}</strong>
        </div>
      `,
    )
    .join('');
}

export function renderChecklist(items) {
  return items
    .map(
      (item) => `
        <li class="check-item">
          <span class="check-item__mark"></span>
          <span>${item}</span>
        </li>
      `,
    )
    .join('');
}

export function renderGeneratedAssets(assets) {
  return assets
    .map(
      (asset) => `
        <figure class="asset-card">
          <img src="${asset.src}" alt="${asset.label}" loading="lazy" />
          <figcaption>${asset.label}</figcaption>
        </figure>
      `,
    )
    .join('');
}