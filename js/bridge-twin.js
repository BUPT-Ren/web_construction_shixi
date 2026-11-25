
window.BridgeTwin = {
  render(project) {
    const markers = project.keyPoints.map((point, index) => {
      const {x, y} = point;
      const labelY = index % 2 ? -29 : 32;
      return `<g class="sensor-hotspot twin-sensor" role="button" tabindex="0"
        aria-label="${point.id} ${point.name}，查看传感器信息" data-point-id="${point.id}"
        data-name="${point.id} ${point.name} · ${point.code}" data-type="${point.type}" data-val="${point.val}" data-unit="${point.unit}"
        transform="translate(${x},${y})">
        <circle class="twin-hit" r="16"/><circle class="twin-pulse" r="10"/><circle class="twin-sensor-core" r="4"/>
        <path class="twin-leader" d="M 0 0 V ${labelY}"/>
        <rect class="twin-label" x="-32" y="${labelY-11}" width="64" height="22" rx="3"/>
        <text y="${labelY+5}" text-anchor="middle">${point.id}</text></g>`;
    }).join('');
    const image = ['juli', 'lekai'].includes(project.id) ? `<image href="assets/img/${project.id}-city.webp" width="1000" height="750"/>` : '';
    return `<svg class="bridge-svg-canvas twin-svg" viewBox="0 75 1000 575" preserveAspectRatio="xMidYMid meet"
      role="group" aria-label="${project.name}城市鸟瞰模型">
      ${image}
      ${markers}</svg>
      <div class="twin-heading"><strong>${project.name}</strong><b>${project.keyPoints.length} 个示意测点</b></div>
      <div id="sensor-tooltip" class="sensor-tooltip-box" role="tooltip"></div>`;
  }
};
