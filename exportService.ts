
import { ChecklistData } from './types';
import { jsPDF } from 'jspdf';

// Helper to format date
const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleString('pt-BR');
};

const boolToText = (val: boolean) => (val ? 'Sim' : 'Não');

export const getConclusion = (data: ChecklistData): string => {
  const switchCount = data.switches.reduce((acc, s) => acc + s.quantity, 0);
  const antennaCount = data.antennas.reduce((acc, a) => acc + a.quantity, 0);
  
  let text = `A visita técnica realizada em ${new Date(data.visitDate).toLocaleDateString('pt-BR')} ao local "${data.locationName}" `;
  text += `identificou uma infraestrutura composta por ${switchCount} switch(es) de rede e ${antennaCount} antena(s) Wi-Fi. `;
  
  if (data.cableCondition === 'Desorganizado') {
    text += `A organização do cabeamento estruturado encontra-se crítica (Desorganizada), necessitando de intervenção. `;
  } else if (data.cableCondition === 'Parcial') {
    text += `A organização dos cabos apresenta pontos de melhoria (Parcial). `;
  } else {
    text += `O cabeamento estruturado encontra-se devidamente organizado. `;
  }

  if (data.hasFirewall) {
    text += `A segurança perimetral é gerida por firewall ${data.firewallBrand}, estando atualmente ${data.firewallWorking ? 'operacional' : 'com falhas registradas'}. `;
  } else {
    text += `CRÍTICO: Não foi identificado firewall de borda dedicado no local, o que representa risco à segurança da rede. `;
  }

  const issues: string[] = [];
  if (!data.allMachinesOk) issues.push('estações de trabalho com anomalias de hardware ou software');
  if (!data.networkPointsOk) issues.push('pontos de rede física danificados ou inoperantes');
  if (!data.employeesSatisfied) issues.push('insatisfação reportada pelos usuários quanto aos serviços');

  if (issues.length > 0) {
    text += `Foram diagnosticados os seguintes pontos de atenção que requerem plano de ação: ${issues.join(', ')}. `;
  } else {
    text += `De modo geral, a infraestrutura avaliada apresenta estabilidade e boas condições de uso. `;
  }

  return text;
};

/**
 * TXT Export
 */
export const downloadTXT = (data: ChecklistData) => {
  let text = `================================================================\n`;
  text += `           RELATÓRIO DE CHECKLIST - INFRAESTRUTURA DE TI        \n`;
  text += `================================================================\n\n`;
  
  text += `DADOS DA VISITA\n`;
  text += `----------------------------------------------------------------\n`;
  text += `Local:                 ${data.locationName}\n`;
  text += `Data e Hora:           ${formatDate(data.visitDate)}\n`;
  text += `Responsável Local:     ${data.responsibleName || 'Não informado'}\n`;
  text += `Técnico Responsável:   ${data.technicianName}\n\n`;

  text += `1. CPD / INFRAESTRUTURA DE REDE\n`;
  text += `----------------------------------------------------------------\n`;
  text += `[ Cabos ]\n`;
  text += `  - Organização: ${data.cableCondition}\n`;
  text += `  - Observações: ${data.cableNotes || 'Nenhuma'}\n\n`;
  
  text += `[ Switches de Rede ]\n`;
  if (data.switches.length > 0) {
    data.switches.forEach((sw, idx) => {
      text += `  Item ${idx + 1}:\n`;
      text += `    - Quantidade: ${sw.quantity}\n`;
      text += `    - Equipamento: ${sw.brand} ${sw.model}\n`;
      text += `    - Portas: ${sw.ports}\n`;
      text += `    - Condição: ${sw.conditionOk ? 'OK' : 'DEFEITO'}\n`;
      if(sw.notes) text += `    - Obs: ${sw.notes}\n`;
    });
  } else {
    text += `  - Nenhum switch registrado.\n`;
  }
  text += `\n`;

  text += `[ Antenas Wi-Fi ]\n`;
  if (data.antennas.length > 0) {
    data.antennas.forEach((ant, idx) => {
      text += `  Item ${idx + 1}:\n`;
      text += `    - Quantidade: ${ant.quantity}\n`;
      text += `    - Marca: ${ant.brand}\n`;
      text += `    - Funcionando: ${boolToText(ant.isWorking)}\n`;
      if(ant.notes) text += `    - Obs: ${ant.notes}\n`;
    });
  } else {
    text += `  - Nenhuma antena registrada.\n`;
  }
  text += `\n`;

  text += `[ Firewall ]\n`;
  text += `  - Existe Firewall: ${boolToText(data.hasFirewall)}\n`;
  if (data.hasFirewall) {
    text += `  - Marca: ${data.firewallBrand}\n`;
    text += `  - Status: ${data.firewallWorking ? 'Funcionando Normalmente' : 'Apresentando Falhas'}\n`;
    text += `  - Obs: ${data.firewallNotes || '-'}\n`;
  }
  text += `\n`;

  text += `2. ESTAÇÕES DE TRABALHO (MÁQUINAS)\n`;
  text += `----------------------------------------------------------------\n`;
  text += `  - Status Geral: ${data.allMachinesOk ? 'Todas as máquinas estão operacionais.' : 'Foram encontrados problemas.'}\n`;
  if (!data.allMachinesOk) {
    data.problematicMachines.forEach((pm, idx) => {
      text += `\n  [ Máquina com Problema #${idx + 1} ]\n`;
      text += `    - ID: ${pm.identifier}\n`;
      text += `    - Processador: ${pm.processorGen}\n`;
      text += `    - Windows 11 Atualizado: ${boolToText(pm.osUpdated)}\n`;
      text += `    - Descrição do Problema: ${pm.problemDescription}\n`;
    });
  }
  text += `\n`;

  text += `3. PONTOS DE REDE FÍSICA\n`;
  text += `----------------------------------------------------------------\n`;
  text += `  - Estado dos Pontos: ${data.networkPointsOk ? 'Em perfeito estado' : 'Necessitam reparos'}\n`;
  text += `  - Observações: ${data.networkPointsNotes || 'Nenhuma'}\n\n`;

  text += `4. SATISFAÇÃO DOS USUÁRIOS\n`;
  text += `----------------------------------------------------------------\n`;
  text += `  - Os colaboradores estão satisfeitos? ${boolToText(data.employeesSatisfied)}\n`;
  if (!data.employeesSatisfied) {
    text += `  - Relato de Reclamações: ${data.complaints}\n`;
  }
  text += `\n`;

  text += `5. CONCLUSÃO TÉCNICA\n`;
  text += `----------------------------------------------------------------\n`;
  text += getConclusion(data);
  text += `\n\n`;

  if (data.observations) {
    text += `OBSERVAÇÕES GERAIS\n`;
    text += `----------------------------------------------------------------\n`;
    text += `${data.observations}\n\n`;
  }

  text += `\n\n`;
  text += `___________________________________________________\n`;
  text += `Assinatura do Técnico Responsável: ${data.technicianName}\n\n\n`;
  text += `___________________________________________________\n`;
  text += `[ Espaço para Carimbo ]\n`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio_${data.locationName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * DOCX Export
 */
export const downloadDOCX = (data: ChecklistData) => {
  const conclusion = getConclusion(data);
  
  // CSS styling for Word
  const styles = `
    body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h1 { font-size: 18pt; color: #000; margin: 0; text-transform: uppercase; }
    h2 { font-size: 14pt; color: #1f4e79; border-bottom: 1px solid #ccc; margin-top: 25px; padding-bottom: 5px; }
    h3 { font-size: 12pt; font-weight: bold; margin-top: 15px; color: #444; }
    .meta-table { width: 100%; margin-bottom: 20px; }
    .meta-table td { padding: 5px; vertical-align: top; }
    .label { font-weight: bold; color: #555; }
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
    table.data-table th { background-color: #f2f2f2; border: 1px solid #999; padding: 8px; text-align: left; }
    table.data-table td { border: 1px solid #ccc; padding: 8px; }
    .conclusion-box { background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 15px; margin-top: 10px; }
    .footer { margin-top: 60px; page-break-inside: avoid; }
    .signature-line { border-top: 1px solid #000; width: 60%; margin-top: 50px; padding-top: 5px; }
    .stamp-box { border: 1px dashed #999; width: 200px; height: 100px; margin-top: 30px; display: flex; align-items: center; justify-content: center; text-align: center; color: #999; }
  `;

  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Relatório</title>
    <style>${styles}</style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Checklist</h1>
        <p style="margin:5px 0 0 0; font-size: 12pt;">Infraestrutura de TI</p>
      </div>

      <table class="meta-table">
        <tr>
          <td width="20%"><span class="label">Local:</span></td>
          <td width="80%"><strong>${data.locationName}</strong></td>
        </tr>
        <tr>
          <td><span class="label">Data/Hora:</span></td>
          <td>${formatDate(data.visitDate)}</td>
        </tr>
        <tr>
          <td><span class="label">Responsável Local:</span></td>
          <td>${data.responsibleName}</td>
        </tr>
        <tr>
          <td><span class="label">Técnico:</span></td>
          <td>${data.technicianName}</td>
        </tr>
      </table>

      <h2>1. CPD / Infraestrutura</h2>
      
      <p><span class="label">Organização dos Cabos:</span> ${data.cableCondition}</p>
      ${data.cableNotes ? `<p><em>Obs: ${data.cableNotes}</em></p>` : ''}

      <h3>Switches de Rede</h3>
      ${data.switches.length > 0 ? `
      <table class="data-table">
        <thead><tr><th>Qtd</th><th>Equipamento</th><th>Portas</th><th>Condição</th><th>Observações</th></tr></thead>
        <tbody>
        ${data.switches.map(s => `<tr>
          <td>${s.quantity}</td>
          <td>${s.brand} ${s.model}</td>
          <td>${s.ports}</td>
          <td>${s.conditionOk ? 'OK' : 'Falha'}</td>
          <td>${s.notes || '-'}</td>
        </tr>`).join('')}
        </tbody>
      </table>` : '<p>Nenhum switch registrado.</p>'}

      <h3>Antenas Wi-Fi</h3>
      ${data.antennas.length > 0 ? `
      <table class="data-table">
        <thead><tr><th>Qtd</th><th>Marca</th><th>Status</th><th>Observações</th></tr></thead>
        <tbody>
        ${data.antennas.map(a => `<tr>
          <td>${a.quantity}</td>
          <td>${a.brand}</td>
          <td>${a.isWorking ? 'Funcionando' : 'Falha'}</td>
          <td>${a.notes || '-'}</td>
        </tr>`).join('')}
        </tbody>
      </table>` : '<p>Nenhuma antena registrada.</p>'}

      <h3>Firewall</h3>
      <p><strong>Existe Firewall?</strong> ${data.hasFirewall ? 'Sim' : 'Não'}</p>
      ${data.hasFirewall ? `
        <ul>
          <li><strong>Marca:</strong> ${data.firewallBrand}</li>
          <li><strong>Status:</strong> ${data.firewallWorking ? 'Operacional' : 'Com Falha'}</li>
          <li><strong>Obs:</strong> ${data.firewallNotes || '-'}</li>
        </ul>
      ` : ''}

      <h2>2. Máquinas e Computadores</h2>
      <p><strong>Status Geral:</strong> ${data.allMachinesOk ? 'Todas as máquinas estão em perfeito estado.' : 'Foram identificadas máquinas com problemas.'}</p>
      
      ${!data.allMachinesOk ? `
      <table class="data-table">
        <thead><tr><th>ID</th><th>Processador</th><th>Windows 11</th><th>Descrição do Problema</th></tr></thead>
        <tbody>
        ${data.problematicMachines.map(m => `<tr>
          <td>${m.identifier}</td>
          <td>${m.processorGen}</td>
          <td>${boolToText(m.osUpdated)}</td>
          <td style="color:#cc0000">${m.problemDescription}</td>
        </tr>`).join('')}
        </tbody>
      </table>
      ` : ''}

      <h2>3. Pontos de Rede</h2>
      <p><strong>Estado Físico/Funcional:</strong> ${data.networkPointsOk ? 'Bons' : 'Apresentam problemas'}</p>
      <p><em>Obs: ${data.networkPointsNotes || 'Nenhuma observação.'}</em></p>

      <h2>4. Satisfação dos Usuários</h2>
      <p><strong>Satisfação Geral:</strong> ${data.employeesSatisfied ? 'Sim, satisfeitos.' : 'Não, há reclamações.'}</p>
      ${!data.employeesSatisfied ? `<p style="background-color:#fff0f0; padding:10px; border:1px solid #ffcccc;"><strong>Reclamações:</strong> ${data.complaints}</p>` : ''}

      <h2>5. Conclusão e Observações</h2>
      ${data.observations ? `<p><strong>Observações Gerais:</strong> ${data.observations}</p>` : ''}
      
      <div class="conclusion-box">
        <h3>Resumo Técnico</h3>
        <p>${conclusion}</p>
      </div>

      <div class="footer">
        <div class="signature-line">
          <strong>${data.technicianName}</strong><br>
          Técnico Responsável
        </div>

        <div style="margin-top:40px; border:1px dashed #ccc; width:200px; height:100px; padding:10px;">
          <br><br>
          <center>[ Espaço para Carimbo ]</center>
        </div>
      </div>
    </body></html>
  `;

  const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio_${data.locationName.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * PDF Export
 */
export const downloadPDF = (data: ChecklistData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Helper functions
  const checkPageBreak = (needed = 10) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 20;
    }
  };

  const drawLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  };

  const addTitle = (text: string) => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark Blue
    doc.text(text, margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
  };

  const addSubTitle = (text: string) => {
    checkPageBreak(10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(text, margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
  };

  const addPair = (label: string, value: string, indent = 0) => {
    checkPageBreak(7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin + indent, y);
    
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal');
    
    // Handle multi-line values
    const valueLines = doc.splitTextToSize(value, contentWidth - indent - labelWidth);
    doc.text(valueLines, margin + indent + labelWidth, y);
    y += (valueLines.length * 6);
  };

  const addParagraph = (text: string, indent = 0) => {
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, y);
    y += (lines.length * 5) + 2;
  };

  // --- CONTENT START ---

  // Cover / Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Relatório de Checklist', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text('Infraestrutura de TI', pageWidth / 2, y, { align: 'center' });
  y += 15;
  
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Metadata
  addPair('Local', data.locationName);
  addPair('Data e Hora', formatDate(data.visitDate));
  addPair('Responsável Local', data.responsibleName || 'N/A');
  addPair('Técnico Responsável', data.technicianName);
  y += 5;
  drawLine();

  // 1. CPD
  addTitle('1. CPD / Infraestrutura');
  addPair('Organização dos Cabos', data.cableCondition);
  if (data.cableNotes) addParagraph(`Obs: ${data.cableNotes}`, 5);
  y += 3;

  addSubTitle('Switches de Rede');
  if (data.switches.length === 0) {
    addParagraph('Nenhum switch registrado.', 5);
  } else {
    data.switches.forEach((sw, i) => {
      checkPageBreak(15);
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y - 4, contentWidth, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`#${i + 1} | Qtd: ${sw.quantity} | ${sw.brand} ${sw.model}`, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Portas: ${sw.ports} | Status: ${sw.conditionOk ? 'OK' : 'Defeito'}`, margin + 2, y + 5);
      y += 12;
      if (sw.notes) addParagraph(`Obs: ${sw.notes}`, 5);
      y += 2;
    });
  }
  y += 3;

  addSubTitle('Antenas Wi-Fi');
  if (data.antennas.length === 0) {
    addParagraph('Nenhuma antena registrada.', 5);
  } else {
    data.antennas.forEach((ant, i) => {
      checkPageBreak(15);
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y - 4, contentWidth, 10, 'F');
      doc.setFontSize(9);
      doc.text(`#${i + 1} | Qtd: ${ant.quantity} | ${ant.brand} | Status: ${ant.isWorking ? 'OK' : 'Falha'}`, margin + 2, y);
      y += 8;
      if (ant.notes) addParagraph(`Obs: ${ant.notes}`, 5);
      y += 2;
    });
  }
  y += 3;

  addSubTitle('Firewall');
  addPair('Existe Firewall?', data.hasFirewall ? 'Sim' : 'Não');
  if (data.hasFirewall) {
    addPair('Marca', data.firewallBrand, 5);
    addPair('Status', data.firewallWorking ? 'Operacional' : 'Falha', 5);
    if(data.firewallNotes) addParagraph(`Obs: ${data.firewallNotes}`, 5);
  }
  
  // 2. Machines
  y += 5;
  addTitle('2. Máquinas e Computadores');
  addPair('Todas as máquinas OK?', data.allMachinesOk ? 'Sim' : 'Não');
  
  if (!data.allMachinesOk) {
    y += 3;
    data.problematicMachines.forEach((pm, i) => {
      checkPageBreak(20);
      doc.setDrawColor(200, 50, 50); // Red border for issues
      doc.setLineWidth(0.1);
      doc.line(margin, y, margin, y + 15);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Máquina: ${pm.identifier}`, margin + 3, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Proc: ${pm.processorGen} | Win11: ${boolToText(pm.osUpdated)}`, margin + 3, y + 9);
      doc.setTextColor(180, 0, 0);
      doc.text(`Problema: ${pm.problemDescription}`, margin + 3, y + 14);
      doc.setTextColor(0, 0, 0);
      y += 18;
    });
  }

  // 3. Network Points
  y += 5;
  addTitle('3. Pontos de Rede');
  addPair('Estado Geral', data.networkPointsOk ? 'Bons' : 'Com defeitos');
  addParagraph(`Observações: ${data.networkPointsNotes || 'Nenhuma.'}`);

  // 4. Satisfaction
  y += 5;
  addTitle('4. Satisfação');
  addPair('Usuários Satisfeitos?', data.employeesSatisfied ? 'Sim' : 'Não');
  if (!data.employeesSatisfied) {
    doc.setTextColor(180, 0, 0);
    addParagraph(`Reclamações: ${data.complaints}`);
    doc.setTextColor(0, 0, 0);
  }

  // 5. Conclusion
  checkPageBreak(50); // Ensure space for conclusion and signature
  drawLine();
  addTitle('Conclusão Técnica');
  
  const conclusionText = getConclusion(data);
  doc.setFillColor(240, 248, 255); // AliceBlue
  doc.rect(margin, y, contentWidth, 30, 'F'); // Background box
  y += 5;
  
  const splitConclusion = doc.splitTextToSize(conclusionText, contentWidth - 10);
  doc.text(splitConclusion, margin + 5, y);
  
  // Update y based on text height
  y += (splitConclusion.length * 5) + 10;
  
  // Signature Area
  checkPageBreak(40);
  y += 15;
  
  // Technician Sig
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 80, y); // Line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.technicianName, margin, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Técnico Responsável', margin, y + 10);

  // Stamp Box
  const boxX = pageWidth - margin - 60;
  const boxY = y - 10;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([2, 2], 0); // Dashed line
  doc.rect(boxX, boxY, 60, 30);
  doc.setLineDashPattern([], 0); // Reset solid
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Carimbo', boxX + 30, boxY + 15, { align: 'center' });

  doc.save(`Relatorio_${data.locationName.replace(/\s+/g, '_')}.pdf`);
};
