// ========== CARREGADOR DE COMPONENTES HTML ==========
export async function loadComponent(componentPath, targetElementId, append = false) {
  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error(`Erro ao carregar ${componentPath}`);
    const html = await response.text();
    const target = document.getElementById(targetElementId);
    if (target) {
      if (append) {
        target.innerHTML += html;
      } else {
        target.innerHTML = html;
      }
    }
    return true;
  } catch (error) {
    console.error('Erro ao carregar componente:', error);
    return false;
  }
}

export async function loadComponents(components, append = false) {
  for (const comp of components) {
    await loadComponent(comp.path, comp.target, append);
  }
}