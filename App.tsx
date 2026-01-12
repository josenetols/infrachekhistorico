
import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, Plus, Minus, Trash2, Save, FileText, Download, 
  Wifi, Server, Monitor, MessageSquare, Network, ShieldCheck, User, XCircle, LayoutGrid,
  LayoutDashboard, ClipboardList
} from 'lucide-react';
import { initialChecklistState, ChecklistData, SwitchDevice, AntennaDevice, ProblematicMachine } from './types';
import { downloadDOCX, downloadPDF, downloadTXT, getConclusion } from './exportService';
import { Autocomplete } from './components/Autocomplete';
import { Dashboard } from './components/Dashboard';

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType, title: string }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 text-blue-900">
    <Icon className="w-6 h-6" />
    <h2 className="text-xl font-bold">{title}</h2>
  </div>
);

const InputLabel = ({ children }: { children?: React.ReactNode }) => (
  <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" {...props} />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white" {...props} />
);

// Component for numeric input with +/- buttons
const QuantitySelector = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => (
  <div className="flex items-center h-[42px] w-full">
    <button 
      type="button"
      onClick={() => onChange(Math.max(1, value - 1))}
      className="h-full w-10 bg-slate-100 border border-slate-300 border-r-0 rounded-l-md text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center justify-center flex-shrink-0"
    >
      <Minus size={16} />
    </button>
    <div className="h-full flex-1 border-y border-slate-300 relative min-w-[2rem]">
        <input 
          type="number" 
          min="1"
          value={value}
          onChange={(e) => {
             const val = parseInt(e.target.value);
             if (!isNaN(val) && val > 0) onChange(val);
             else if (e.target.value === '') onChange(1);
          }}
          className="w-full h-full text-center border-none focus:ring-0 p-0 text-slate-700 font-medium bg-white"
        />
    </div>
    <button 
      type="button"
      onClick={() => onChange(value + 1)}
      className="h-full w-10 bg-slate-100 border border-slate-300 border-l-0 rounded-r-md text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center justify-center flex-shrink-0"
    >
      <Plus size={16} />
    </button>
  </div>
);

// New Component: Radio Card for better mobile selection
const RadioCard = ({ 
  label, 
  description, 
  checked, 
  onClick, 
  icon: Icon,
  color = 'blue' 
}: { 
  label: string, 
  description?: string, 
  checked: boolean, 
  onClick: () => void,
  icon: React.ElementType,
  color?: 'blue' | 'green' | 'yellow' | 'red'
}) => {
  const styles = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-500' },
    green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-500' },
    yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-800', ring: 'ring-yellow-500' },
    red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-500' },
  };

  const currentStyle = styles[color];

  return (
    <div 
      onClick={onClick}
      className={`relative flex items-center p-4 cursor-pointer border rounded-xl transition-all shadow-sm ${
        checked 
          ? `${currentStyle.border} ${currentStyle.bg} ring-1 ${currentStyle.ring}` 
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
      }`}
    >
        <div className={`flex-shrink-0 mr-4 ${checked ? currentStyle.text : 'text-slate-400'}`}>
            <Icon size={24} />
        </div>
        <div className="flex-1">
            <h3 className={`font-bold text-sm ${checked ? 'text-slate-900' : 'text-slate-700'}`}>{label}</h3>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2 ${checked ? `border-${color}-500 bg-${color}-500` : 'border-slate-300'}`}>
             {checked && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
    </div>
  );
};

// New Component: Segmented Control for quick toggles
const SegmentedControl = ({ 
  options, 
  value, 
  onChange 
}: { 
  options: { label: string, value: any, color?: string }[], 
  value: any, 
  onChange: (val: any) => void 
}) => (
  <div className="flex p-1 bg-slate-100 rounded-lg w-full">
    {options.map((opt) => {
      const isSelected = value === opt.value;
      let textColor = 'text-slate-500';
      if (isSelected) {
        textColor = opt.color || 'text-blue-700';
      }
      return (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-xs font-bold py-2 px-2 rounded-md transition-all shadow-sm ${
            isSelected
              ? `bg-white ${textColor} shadow-sm ring-1 ring-black/5` 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 shadow-none'
          }`}
        >
          {opt.label}
        </button>
      )
    })}
  </div>
);

function App() {
  const [data, setData] = useState<ChecklistData>(initialChecklistState);
  const [view, setView] = useState<'dashboard' | 'form' | 'preview'>('dashboard');

  // --- Logic to Save History ---
  const saveChecklistHistory = (checklist: ChecklistData) => {
      if (!checklist.locationName) return;
      try {
          // Save last visit date for dashboard
          const rawDates = localStorage.getItem('infracheck_history');
          const historyDates = rawDates ? JSON.parse(rawDates) : {};
          historyDates[checklist.locationName] = new Date().toISOString();
          localStorage.setItem('infracheck_history', JSON.stringify(historyDates));

          // Save full checklist data for editing
          const rawData = localStorage.getItem('infracheck_saved_data');
          const savedData = rawData ? JSON.parse(rawData) : {};
          savedData[checklist.locationName] = checklist;
          localStorage.setItem('infracheck_saved_data', JSON.stringify(savedData));
      } catch (e) {
          console.error("Failed to save history", e);
      }
  };

  const startChecklistFromDashboard = (location?: string) => {
      if (location) {
          // Try to load saved data for this location
          const rawData = localStorage.getItem('infracheck_saved_data');
          const savedData = rawData ? JSON.parse(rawData) : {};
          
          if (savedData[location]) {
              setData({
                  ...savedData[location],
                  visitDate: new Date().toISOString() // Update to current date
              });
          } else {
              setData({
                  ...initialChecklistState,
                  locationName: location,
                  visitDate: new Date().toISOString()
              });
          }
      } else {
          setData({ ...initialChecklistState, visitDate: new Date().toISOString() });
      }
      setView('form');
      window.scrollTo(0, 0);
  };

  // --- Handlers ---

  const resetForm = () => {
    if (window.confirm("Deseja iniciar um novo relatório? Todos os dados atuais serão perdidos.")) {
      setData({
        ...initialChecklistState,
        visitDate: new Date().toISOString(),
        switches: [],
        antennas: [],
        problematicMachines: []
      });
      setView('form');
      window.scrollTo(0, 0);
    }
  };

  const handleGenerateReport = () => {
      // Logic to move to preview
      if (!data.locationName || !data.technicianName) {
          alert("Preencha o Nome do Local e do Técnico para continuar.");
          return;
      }
      // Save history immediately when generating report
      saveChecklistHistory(data);
      setView('preview');
      window.scrollTo(0, 0);
  };

  const updateField = (field: keyof ChecklistData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Switches Handlers
  const addSwitch = () => {
    const newSwitch: SwitchDevice = {
      id: crypto.randomUUID(),
      quantity: 1,
      brand: '',
      model: '',
      ports: 24,
      conditionOk: true,
      notes: ''
    };
    setData(prev => ({ ...prev, switches: [...prev.switches, newSwitch] }));
  };

  const removeSwitch = (id: string) => {
    setData(prev => ({ ...prev, switches: prev.switches.filter(s => s.id !== id) }));
  };

  const updateSwitch = (id: string, field: keyof SwitchDevice, value: any) => {
    setData(prev => ({
      ...prev,
      switches: prev.switches.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  // Antennas Handlers
  const addAntenna = () => {
    const newAntenna: AntennaDevice = {
      id: crypto.randomUUID(),
      quantity: 1,
      brand: 'UniFi',
      isWorking: true,
      notes: ''
    };
    setData(prev => ({ 
      ...prev, 
      antennas: [...prev.antennas, newAntenna]
    }));
  };

  const removeAntenna = (id: string) => {
    setData(prev => ({ 
      ...prev, 
      antennas: prev.antennas.filter(a => a.id !== id)
    }));
  };

  const updateAntenna = (id: string, field: keyof AntennaDevice, value: any) => {
    setData(prev => ({
      ...prev,
      antennas: prev.antennas.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  // Machines Handlers
  const addMachine = () => {
    const newMachine: ProblematicMachine = {
      id: crypto.randomUUID(),
      identifier: '',
      processorGen: '',
      osUpdated: true,
      problemDescription: ''
    };
    setData(prev => ({ ...prev, problematicMachines: [...prev.problematicMachines, newMachine] }));
  };

  const removeMachine = (id: string) => {
    setData(prev => ({ ...prev, problematicMachines: prev.problematicMachines.filter(m => m.id !== id) }));
  };

  const updateMachine = (id: string, field: keyof ProblematicMachine, value: any) => {
    setData(prev => ({
      ...prev,
      problematicMachines: prev.problematicMachines.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  // Firewall Handler Helper
  const handleFirewallBrandChange = (value: string) => {
    if (value === 'Outro') {
      updateField('firewallBrand', ''); // Clear to force input
    } else {
      updateField('firewallBrand', value);
    }
  };

  const isCustomFirewall = !['Fortinet', 'SonicWall'].includes(data.firewallBrand) && data.firewallBrand !== '';
  const firewallSelectValue = ['Fortinet', 'SonicWall'].includes(data.firewallBrand) ? data.firewallBrand : 'Outro';

  // --- Views ---

  const renderContent = () => {
    if (view === 'dashboard') {
        return <Dashboard onStartChecklist={startChecklistFromDashboard} />;
    }

    if (view === 'preview') {
      const conclusion = getConclusion(data);
      return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Relatório Gerado</h1>
              <p className="opacity-80 text-sm">Verifique os dados antes de exportar</p>
            </div>
            <button onClick={() => setView('form')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition text-sm">
              Editar
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Checklist registrado com sucesso para este local!</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-bold text-slate-700 mb-2">Informações</h3>
                  <p><span className="font-semibold">Local:</span> {data.locationName}</p>
                  <p><span className="font-semibold">Data:</span> {new Date(data.visitDate).toLocaleString()}</p>
                  <p><span className="font-semibold">Responsável Local:</span> {data.responsibleName}</p>
                  <p><span className="font-semibold text-blue-700">Técnico:</span> {data.technicianName}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-bold text-slate-700 mb-2">Resumo Status</h3>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Máquinas:</span> 
                    {data.allMachinesOk ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={16}/> OK</span> : <span className="text-red-600 flex items-center gap-1"><AlertCircle size={16}/> Problemas</span>}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Rede:</span> 
                    {data.networkPointsOk ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={16}/> OK</span> : <span className="text-red-600 flex items-center gap-1"><AlertCircle size={16}/> Ruim</span>}
                  </p>
               </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                <h3 className="font-bold text-blue-900 mb-2">Conclusão Gerada Automaticamente</h3>
                <p className="text-slate-800 text-sm leading-relaxed">{conclusion}</p>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">Exportar Relatório</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => downloadPDF(data)} className="flex items-center justify-center gap-2 bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition shadow-sm font-semibold">
                    <Download size={20} /> Baixar PDF
                  </button>
                  <button onClick={() => downloadDOCX(data)} className="flex items-center justify-center gap-2 bg-blue-700 text-white p-4 rounded-lg hover:bg-blue-800 transition shadow-sm font-semibold">
                    <FileText size={20} /> Baixar Word (DOCX)
                  </button>
                  <button onClick={() => downloadTXT(data)} className="flex items-center justify-center gap-2 bg-slate-700 text-white p-4 rounded-lg hover:bg-slate-800 transition shadow-sm font-semibold">
                    <FileText size={20} /> Baixar TXT
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                    <button 
                        onClick={() => setView('dashboard')}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-900 font-bold p-4 rounded-lg transition-all"
                    >
                        <LayoutDashboard size={20} /> Voltar para o Painel
                    </button>
                </div>
            </div>
          </div>
        </div>
      );
    }

    // --- Form View ---
    return (
      <div className="space-y-6">
        {/* 1. Local Info */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <SectionTitle icon={FileText} title="1. Informações do Local" />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
                <Autocomplete 
                    label="Nome do Local"
                    value={data.locationName} 
                    onChange={val => updateField('locationName', val)}
                    placeholder="Busque ou digite o nome do local..."
                />
            </div>
            <div>
                <InputLabel>Responsável pelo Local</InputLabel>
                <StyledInput 
                    placeholder="Ex: Cliente (João Silva)" 
                    value={data.responsibleName} 
                    onChange={e => updateField('responsibleName', e.target.value)} 
                />
            </div>
          </div>
        </section>

        {/* 2. CPD / Infra */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <SectionTitle icon={Server} title="2. CPD / Infraestrutura" />
          
          {/* Cabos */}
          <div className="mb-6">
            <InputLabel>2.1 Organização dos Cabos</InputLabel>
            <div className="grid grid-cols-1 gap-3 mt-3">
                <RadioCard
                    label="Bem Organizado"
                    description="Cabeamento estruturado, identificado e sem emaranhados."
                    color="green"
                    icon={CheckCircle2}
                    checked={data.cableCondition === 'Organizado'}
                    onClick={() => updateField('cableCondition', 'Organizado')}
                />
                <RadioCard
                    label="Parcialmente Organizado"
                    description="Alguns cabos soltos ou sem identificação, mas funcional."
                    color="yellow"
                    icon={LayoutGrid}
                    checked={data.cableCondition === 'Parcial'}
                    onClick={() => updateField('cableCondition', 'Parcial')}
                />
                <RadioCard
                    label="Desorganizado"
                    description="Emaranhado crítico, difícil identificação ou risco de desconexão."
                    color="red"
                    icon={AlertCircle}
                    checked={data.cableCondition === 'Desorganizado'}
                    onClick={() => updateField('cableCondition', 'Desorganizado')}
                />
            </div>
            <div className="mt-3">
              <InputLabel>Observações sobre Cabos</InputLabel>
              <textarea 
                  className="w-full p-2 border rounded-md text-sm" 
                  placeholder="Detalhes adicionais..."
                  rows={2}
                  value={data.cableNotes}
                  onChange={e => updateField('cableNotes', e.target.value)}
              />
            </div>
          </div>

          {/* Switches */}
          <div className="mb-6 border-t pt-4">
            <div className="flex justify-between items-center mb-3">
                <InputLabel>2.2 Switches de Rede</InputLabel>
                <button onClick={addSwitch} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 flex items-center gap-1 font-medium">
                    <Plus size={14} /> Adicionar Grupo
                </button>
            </div>
            
            <div className="space-y-3">
                {data.switches.map((sw, index) => (
                    <div key={sw.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                        <button onClick={() => removeSwitch(sw.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1">
                            <Trash2 size={16} />
                        </button>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Item #{index + 1}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Qtd.</label>
                                <QuantitySelector value={sw.quantity} onChange={val => updateSwitch(sw.id, 'quantity', val)} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-slate-500">Marca</label>
                                <StyledInput placeholder="Ex: Cisco" value={sw.brand} onChange={e => updateSwitch(sw.id, 'brand', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-slate-500">Modelo</label>
                                <StyledInput placeholder="Ex: 2960" value={sw.model} onChange={e => updateSwitch(sw.id, 'model', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Portas</label>
                                <StyledInput type="number" placeholder="24" value={sw.ports} onChange={e => updateSwitch(sw.id, 'ports', parseInt(e.target.value))} />
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className="text-xs text-slate-500 mb-1 block">Condição</label>
                                <SegmentedControl 
                                  value={sw.conditionOk}
                                  onChange={val => updateSwitch(sw.id, 'conditionOk', val)}
                                  options={[
                                    { label: 'Funcional', value: true, color: 'text-green-600' },
                                    { label: 'Defeito', value: false, color: 'text-red-600' }
                                  ]}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-4">
                                <StyledInput placeholder="Observações do switch..." value={sw.notes} onChange={e => updateSwitch(sw.id, 'notes', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
                {data.switches.length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">Nenhum switch adicionado.</p>}
            </div>
          </div>

          {/* Wi-Fi */}
          <div className="mb-6 border-t pt-4">
             <div className="flex justify-between items-center mb-3">
                <InputLabel>2.3 Antenas Wi-Fi</InputLabel>
                <button onClick={addAntenna} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 flex items-center gap-1 font-medium">
                    <Plus size={14} /> Adicionar Grupo
                </button>
            </div>
            <div className="space-y-3">
                {data.antennas.map((ant, index) => (
                    <div key={ant.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
                        <button onClick={() => removeAntenna(ant.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1">
                            <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                             <div>
                                <label className="text-xs text-slate-500 block mb-1">Qtd.</label>
                                <QuantitySelector value={ant.quantity} onChange={val => updateAntenna(ant.id, 'quantity', val)} />
                             </div>
                             <div className="col-span-2">
                                <label className="text-xs text-slate-500">Marca</label>
                                <StyledSelect value={ant.brand} onChange={e => updateAntenna(ant.id, 'brand', e.target.value)}>
                                    <option value="UniFi">UniFi</option>
                                    <option value="Aruba">Aruba</option>
                                    <option value="Outra">Outra</option>
                                </StyledSelect>
                             </div>
                             <div className="col-span-2">
                                <label className="text-xs text-slate-500 mb-1 block">Status</label>
                                <SegmentedControl
                                  value={ant.isWorking}
                                  onChange={val => updateAntenna(ant.id, 'isWorking', val)}
                                  options={[
                                    { label: 'OK', value: true, color: 'text-green-600' },
                                    { label: 'Falha', value: false, color: 'text-red-600' }
                                  ]}
                                />
                             </div>
                             <div className="col-span-2 md:col-span-5">
                                <StyledInput placeholder="Observações (Modelo, local...)" value={ant.notes} onChange={e => updateAntenna(ant.id, 'notes', e.target.value)} />
                             </div>
                        </div>
                    </div>
                ))}
                {data.antennas.length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">Nenhuma antena adicionada.</p>}
            </div>
          </div>

          {/* Firewall */}
          <div className="border-t pt-4">
             <InputLabel>2.4 Firewall</InputLabel>
             <div className="flex items-center gap-4 mb-3 mt-2">
                 <div className="w-full">
                   <RadioCard
                      label={data.hasFirewall ? "Sim, existe firewall dedicado" : "Não, não existe firewall"}
                      checked={data.hasFirewall}
                      onClick={() => updateField('hasFirewall', !data.hasFirewall)}
                      icon={ShieldCheck}
                      color={data.hasFirewall ? 'green' : 'blue'} 
                      description="Clique para alternar (Sim / Não)"
                   />
                 </div>
             </div>
             {data.hasFirewall && (
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <InputLabel>Marca</InputLabel>
                        <StyledSelect value={firewallSelectValue} onChange={(e) => handleFirewallBrandChange(e.target.value)}>
                            <option value="Fortinet">Fortinet</option>
                            <option value="SonicWall">SonicWall</option>
                            <option value="Outro">Outro</option>
                        </StyledSelect>
                        {firewallSelectValue === 'Outro' && (
                           <div className="mt-2">
                             <StyledInput 
                                placeholder="Digite a marca..." 
                                value={data.firewallBrand} 
                                onChange={(e) => updateField('firewallBrand', e.target.value)} 
                                autoFocus
                             />
                           </div>
                        )}
                    </div>
                    <div>
                        <InputLabel>Status</InputLabel>
                        <SegmentedControl
                            value={data.firewallWorking}
                            onChange={val => updateField('firewallWorking', val)}
                            options={[
                                { label: 'Funcionando', value: true, color: 'text-green-600' },
                                { label: 'Com Falha', value: false, color: 'text-red-600' }
                            ]}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <InputLabel>Observações</InputLabel>
                        <StyledInput value={data.firewallNotes} onChange={e => updateField('firewallNotes', e.target.value)} />
                    </div>
                 </div>
             )}
          </div>
        </section>

        {/* 3. Machines */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <SectionTitle icon={Monitor} title="3. Máquinas / Computadores" />
          
          <div className="mb-4">
            <p className="font-medium text-slate-800 mb-2">Todas as máquinas estão em perfeito estado?</p>
            <div className="flex gap-4">
                <button 
                    onClick={() => updateField('allMachinesOk', true)}
                    className={`flex-1 py-3 px-4 rounded-lg border font-medium flex items-center justify-center gap-2 transition ${data.allMachinesOk ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white hover:bg-slate-50'}`}
                >
                    <CheckCircle2 size={18} /> Sim, todas OK
                </button>
                <button 
                    onClick={() => {
                        updateField('allMachinesOk', false);
                        if(data.problematicMachines.length === 0) addMachine();
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg border font-medium flex items-center justify-center gap-2 transition ${!data.allMachinesOk ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white hover:bg-slate-50'}`}
                >
                    <AlertCircle size={18} /> Não, há problemas
                </button>
            </div>
          </div>

          {!data.allMachinesOk && (
            <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-red-800">Registrar Máquinas com Problema</h3>
                    <button onClick={addMachine} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 font-medium">
                        + Adicionar Outra
                    </button>
                </div>
                {data.problematicMachines.map((pm, idx) => (
                    <div key={pm.id} className="border-l-4 border-red-500 bg-red-50/50 pl-4 py-2 pr-2 rounded-r-lg relative">
                        <button onClick={() => removeMachine(pm.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-700">
                            <Trash2 size={16}/>
                        </button>
                        <div className="grid gap-3">
                            <div>
                                <InputLabel>Identificação (Tag/Nome)</InputLabel>
                                <StyledInput value={pm.identifier} onChange={e => updateMachine(pm.id, 'identifier', e.target.value)} placeholder="Ex: NOT-045" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <InputLabel>Processador</InputLabel>
                                    <StyledInput value={pm.processorGen} onChange={e => updateMachine(pm.id, 'processorGen', e.target.value)} placeholder="Ex: i5 10ª Geração" />
                                </div>
                                <div>
                                    <InputLabel>Windows 11?</InputLabel>
                                    <SegmentedControl
                                        value={pm.osUpdated}
                                        onChange={val => updateMachine(pm.id, 'osUpdated', val)}
                                        options={[
                                            { label: 'Sim', value: true, color: 'text-green-600' },
                                            { label: 'Não', value: false, color: 'text-red-600' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div>
                                <InputLabel>Descrição do Problema</InputLabel>
                                <StyledInput value={pm.problemDescription} onChange={e => updateMachine(pm.id, 'problemDescription', e.target.value)} placeholder="Ex: Lentidão extrema, HD com barulho..." />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </section>

        {/* 4. Network Points */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <SectionTitle icon={Network} title="4. Pontos de Rede" />
          
          <div className="mb-4">
             <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors bg-white">
                 <span className="font-medium text-slate-700 pr-4">Os pontos de rede estão em bom estado físico e funcional?</span>
                 <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-bold ${data.networkPointsOk ? 'text-green-600' : 'text-slate-400'}`}>SIM</span>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${data.networkPointsOk ? 'bg-green-500' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${data.networkPointsOk ? 'translate-x-6' : ''}`}></div>
                    </div>
                    <input type="checkbox" className="hidden" checked={data.networkPointsOk} onChange={e => updateField('networkPointsOk', e.target.checked)} />
                 </div>
             </label>
          </div>
          <div>
            <InputLabel>Observações sobre os pontos</InputLabel>
            <textarea 
                className="w-full border rounded-md p-2 text-sm" 
                rows={2} 
                value={data.networkPointsNotes}
                onChange={e => updateField('networkPointsNotes', e.target.value)}
                placeholder="Ex: Ponto da sala de reunião está solto..."
            />
          </div>
        </section>

        {/* 5. Employee Satisfaction */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <SectionTitle icon={MessageSquare} title="5. Satisfação dos Colaboradores" />
          
          <div className="space-y-4">
            <p className="font-medium text-slate-700">Como está a percepção dos serviços prestados?</p>
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => updateField('employeesSatisfied', true)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${data.employeesSatisfied ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                >
                    <CheckCircle2 size={32} />
                    <span className="font-bold">Satisfeitos</span>
                </button>
                <button 
                    onClick={() => updateField('employeesSatisfied', false)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${!data.employeesSatisfied ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                >
                    <AlertCircle size={32} />
                    <span className="font-bold">Há Reclamações</span>
                </button>
            </div>

            {!data.employeesSatisfied && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <InputLabel>Descreva as reclamações</InputLabel>
                    <textarea 
                        className="w-full border-red-300 focus:border-red-500 focus:ring-red-200 rounded-md p-3 text-sm" 
                        rows={3} 
                        placeholder="Quais são as principais queixas dos usuários?"
                        value={data.complaints}
                        onChange={e => updateField('complaints', e.target.value)}
                    />
                </div>
            )}
          </div>
        </section>

        {/* Finalization */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SectionTitle icon={ShieldCheck} title="Finalização" />
            
            <div className="mb-6">
                <InputLabel>Observações Gerais</InputLabel>
                <textarea 
                    className="w-full border rounded-md p-2" 
                    rows={4} 
                    placeholder="Outros detalhes relevantes da visita..."
                    value={data.observations}
                    onChange={e => updateField('observations', e.target.value)}
                />
            </div>

            <div className="mb-8">
                <InputLabel>Responsável pela Visita (Técnico)</InputLabel>
                <div className="flex items-center gap-2">
                    <User className="text-slate-400" />
                    <StyledInput 
                        placeholder="Nome completo do técnico" 
                        value={data.technicianName}
                        onChange={e => updateField('technicianName', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={() => {
                        saveChecklistHistory(data);
                        alert("Progresso salvo com sucesso!");
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 text-lg"
                >
                    <Save className="w-6 h-6" />
                    Salvar Rascunho
                </button>
                <button 
                    onClick={handleGenerateReport}
                    disabled={!data.locationName || !data.technicianName}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 text-lg"
                >
                    <FileText className="w-6 h-6" />
                    Gerar Relatório
                </button>
            </div>
            {(!data.locationName || !data.technicianName) && (
                <p className="text-center text-sm text-red-500 mt-2">Preencha o Nome do Local e do Técnico para continuar.</p>
            )}
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-900">
                <Server className="w-8 h-8" />
                <div>
                    <h1 className="font-bold text-lg leading-tight">InfraCheck BR</h1>
                    <p className="text-xs text-slate-500">Checklist de Visita Técnica</p>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Data Atual</p>
                <p className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setView('dashboard')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                    view === 'dashboard' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                  <LayoutDashboard size={18} /> Painel Mensal
              </button>
              <button
                onClick={() => setView('form')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                    view === 'form' || view === 'preview'
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                  <ClipboardList size={18} /> Novo Checklist
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

