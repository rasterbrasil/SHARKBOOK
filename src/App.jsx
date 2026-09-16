import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Camera, Clock3, ImagePlus,
  MapPin, Plus, Scissors, Trash2, Upload, UserRound, X
} from 'lucide-react';

const suggestedServices = [
  { id: 'corte', name: 'Corte Masculino', price: 40, duration: 30, emoji: '✂️' },
  { id: 'infantil', name: 'Corte Infantil', price: 35, duration: 30, emoji: '👦' },
  { id: 'barba', name: 'Barba', price: 25, duration: 20, emoji: '🧔' },
  { id: 'combo', name: 'Corte + Barba', price: 60, duration: 50, emoji: '💈' }
];

const defaultHours = [
  ['Segunda-feira', true, '09:00', '19:00'], ['Terça-feira', true, '09:00', '19:00'],
  ['Quarta-feira', true, '09:00', '19:00'], ['Quinta-feira', true, '09:00', '19:00'],
  ['Sexta-feira', true, '09:00', '19:00'], ['Sábado', true, '09:00', '17:00'], ['Domingo', false, '09:00', '13:00']
];

const initialData = {
  business: { name: '', phone: '', cep: '', number: '', street: '' },
  teamSize: '', professionals: [], services: suggestedServices.map(s => ({ ...s, selected: false })),
  hours: defaultHours.map(([day, enabled, start, end]) => ({ day, enabled, start, end })),
  logo: '', portfolio: []
};

function loadData() {
  try { return { ...initialData, ...JSON.parse(localStorage.getItem('sharkbook_onboarding') || '{}') }; }
  catch { return initialData; }
}

export default function App() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(loadData);
  const [toast, setToast] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: '', price: 0, duration: 30 });

  useEffect(() => localStorage.setItem('sharkbook_onboarding', JSON.stringify(data)), [data]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); } }, [toast]);

  const progress = Math.round((step / 7) * 100);
  const selectedServices = useMemo(() => data.services.filter(s => s.selected), [data.services]);

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const updateBusiness = (key, value) => setData(prev => ({ ...prev, business: { ...prev.business, [key]: value } }));

  function validate() {
    if (step === 1 && !data.business.name.trim()) return 'Informe o nome da barbearia para continuar.';
    if (step === 2 && !data.teamSize) return 'Selecione o tamanho da sua equipe.';
    if (step === 3 && data.professionals.some(p => !p.photo)) return 'Adicione a foto do profissional pra continuar. Sem foto, o cliente não sabe quem vai atender ele — e isso é motivo real pra ele desistir do agendamento.';
    if (step === 3 && data.professionals.length === 0) return 'Adicione pelo menos um profissional para continuar.';
    if (step === 4 && selectedServices.length === 0) return 'Selecione pelo menos um serviço para continuar.';
    if (step === 7 && data.portfolio.length === 0) return 'Adicione pelo menos 1 imagem ao portfólio para continuar.';
    return '';
  }

  function next() {
    const error = validate();
    if (error) { setToast(error); return; }
    if (step < 7) setStep(s => s + 1);
    else setStep(8);
  }

  function addProfessional() {
    update('professionals', [...data.professionals, { id: Date.now(), name: '', specialty: '', photo: '' }]);
  }

  function updateProfessional(id, key, value) {
    update('professionals', data.professionals.map(p => p.id === id ? { ...p, [key]: value } : p));
  }

  function removeProfessional(id) { update('professionals', data.professionals.filter(p => p.id !== id)); }

  function fileToDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => callback(e.target.result);
    reader.readAsDataURL(file);
  }

  function toggleService(id) { update('services', data.services.map(s => s.id === id ? { ...s, selected: !s.selected } : s)); }
  function editService(id, key, value) { update('services', data.services.map(s => s.id === id ? { ...s, [key]: value } : s)); }

  function addCustomService() {
    if (!custom.name.trim()) return;
    update('services', [...data.services, { ...custom, id: `custom-${Date.now()}`, selected: true, emoji: '💇' }]);
    setCustom({ name: '', price: 0, duration: 30 }); setCustomOpen(false);
  }

  function applyHours(mode) {
    update('hours', data.hours.map(h => mode === 'weekdays' ? { ...h, enabled: h.day !== 'Domingo' } : { ...h, enabled: true }));
  }

  function updateHour(index, key, value) { update('hours', data.hours.map((h, i) => i === index ? { ...h, [key]: value } : h)); }

  if (step === 8) return <Completion data={data} onTest={() => setToast('Agendamento teste criado em tempo real! 🎉')} onDashboard={() => setStep(1)} toast={toast} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Scissors size={20}/></div><span>SharkBook</span></div>
        <div className="step-counter">Etapa {step} de 7</div>
      </header>

      <main className="wizard-wrap">
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }}/></div>
        <div className="steps-row">
          {Array.from({ length: 7 }, (_, i) => i + 1).map(n => <div key={n} className={`step-dot ${n < step ? 'done' : ''} ${n === step ? 'active' : ''}`}>{n < step ? <Check size={15}/> : n}</div>)}
        </div>

        {step === 1 && <StepCard title="Vamos começar pela sua barbearia" subtitle="Nome, endereço e telefone são o que o cliente vê primeiro.">
          <div className="form-grid"><Field label="Nome da barbearia" value={data.business.name} onChange={v => updateBusiness('name', v)} placeholder="Ex: Barbearia Shark" />
          <Field label="Telefone (WhatsApp)" value={data.business.phone} onChange={v => updateBusiness('phone', v)} placeholder="(67) 99999-9999" />
          <Field label="CEP" value={data.business.cep} onChange={v => updateBusiness('cep', v)} placeholder="00000-000" />
          <Field label="Número" value={data.business.number} onChange={v => updateBusiness('number', v)} placeholder="123" />
          <div className="field full"><label>Rua</label><div className="input-icon"><MapPin size={17}/><input value={data.business.street} onChange={e => updateBusiness('street', e.target.value)} placeholder="Digite o CEP para buscar automaticamente" /></div></div></div>
        </StepCard>}

        {step === 2 && <StepCard title="Quantos profissionais atendem com você?" subtitle="Isso ajuda a definir o plano ideal depois."><div className="choice-grid">{[['1-2 barbeiros','Você e mais um'],['3-4 barbeiros','Equipe no ritmo'],['5 ou mais barbeiros','Operação grande']].map(([title, desc]) => <button key={title} className={`choice-card ${data.teamSize === title ? 'selected' : ''}`} onClick={() => update('teamSize', title)}><div className="choice-icon"><UserRound/></div><strong>{title}</strong><span>{desc}</span><i>{data.teamSize === title ? <CheckCircle2/> : ''}</i></button>)}</div></StepCard>}

        {step === 3 && <StepCard title="Cadastre seus profissionais" subtitle="Adicione quem atende seus clientes."><div className="list-stack">{data.professionals.map(p => <div className="professional-card" key={p.id}><label className="avatar-upload">{p.photo ? <img src={p.photo}/> : <><Camera/><small>Foto *</small></>}<input type="file" accept="image/*" onChange={e => fileToDataUrl(e.target.files[0], v => updateProfessional(p.id, 'photo', v))}/></label><div className="professional-fields"><Field label="Nome" value={p.name} onChange={v => updateProfessional(p.id, 'name', v)} placeholder="Nome do profissional"/><Field label="Especialidades (opcional)" value={p.specialty} onChange={v => updateProfessional(p.id, 'specialty', v)} placeholder="Corte, barba..."/></div><button className="icon-btn danger" onClick={() => removeProfessional(p.id)} aria-label="Remover"><X/></button></div>)}<button className="dashed-btn" onClick={addProfessional}><Plus/> Adicionar profissional</button></div></StepCard>}

        {step === 4 && <StepCard title="Cadastre seus serviços" subtitle="Selecione os serviços que sua barbearia oferece e ajuste preço e duração."><div className="service-grid">{data.services.map(s => <div className={`service-card ${s.selected ? 'selected' : ''}`} key={s.id} onClick={() => toggleService(s.id)}><div className="service-art"><span>{s.emoji}</span>{s.selected && <div className="check-badge"><Check size={14}/></div>}</div><div className="service-info"><strong>{s.name}</strong><div className="service-edit"><label>R$ <input type="number" value={s.price} onClick={e => e.stopPropagation()} onChange={e => editService(s.id, 'price', Number(e.target.value))}/></label><label><Clock3 size={13}/><input type="number" value={s.duration} onClick={e => e.stopPropagation()} onChange={e => editService(s.id, 'duration', Number(e.target.value))}/> min</label></div></div></div>)}</div><button className="dashed-btn" onClick={() => setCustomOpen(true)}><Plus/> Adicionar serviço personalizado</button>{customOpen && <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={() => setCustomOpen(false)}><X/></button><h3>Novo serviço</h3><Field label="Nome" value={custom.name} onChange={v => setCustom(c => ({...c, name:v}))} placeholder="Ex: Degradê"/><div className="form-grid"><Field label="Preço" type="number" value={custom.price} onChange={v => setCustom(c => ({...c, price:Number(v)}))}/><Field label="Duração (min)" type="number" value={custom.duration} onChange={v => setCustom(c => ({...c, duration:Number(v)}))}/></div><button className="primary-btn" onClick={addCustomService}>Salvar serviço</button></div></div>}</StepCard>}

        {step === 5 && <StepCard title="Seus horários de atendimento" subtitle="Defina quando sua equipe estará disponível para receber agendamentos."><div className="apply-hours"><div><strong>Aplicar mesmo horário em vários dias</strong><span>Defina um horário e aplique rapidamente.</span></div><div className="quick-actions"><button onClick={() => applyHours('weekdays')}>Seg a Sex</button><button onClick={() => applyHours('all')}>Todos os dias</button></div></div><div className="hours-list">{data.hours.map((h, i) => <div className={`hour-row ${!h.enabled ? 'disabled' : ''}`} key={h.day}><strong>{h.day}</strong><button className={`toggle ${h.enabled ? 'on' : ''}`} onClick={() => updateHour(i, 'enabled', !h.enabled)}><span/></button>{h.enabled ? <><input type="time" value={h.start} onChange={e => updateHour(i, 'start', e.target.value)}/><span>até</span><input type="time" value={h.end} onChange={e => updateHour(i, 'end', e.target.value)}/></> : <em>Fechado</em>}</div>)}</div></StepCard>}

        {step === 6 && <StepCard title="Sua marca no topo da página" subtitle="Adicione o logo para deixar sua página de agendamento com a identidade da sua barbearia."><label className="dropzone">{data.logo ? <img src={data.logo}/> : <><Upload/><strong>Enviar logo</strong><span>Arraste ou clique para selecionar uma imagem</span></>}<input type="file" accept="image/*" onChange={e => fileToDataUrl(e.target.files[0], v => update('logo', v))}/></label></StepCard>}

        {step === 7 && <StepCard title="Fotos que fazem o cliente confiar" subtitle="É a vitrine da sua página, o que convence alguém a marcar."><div className="portfolio-grid">{data.portfolio.map((img, i) => <div className="portfolio-item" key={i}><img src={img}/><button onClick={() => update('portfolio', data.portfolio.filter((_, j) => j !== i))}><Trash2 size={15}/></button></div>)}<label className="portfolio-add"><ImagePlus/><strong>Adicionar</strong><input type="file" accept="image/*" onChange={e => fileToDataUrl(e.target.files[0], v => update('portfolio', [...data.portfolio, v]))}/></label></div><p className="helper">Adicione pelo menos uma imagem para continuar.</p></StepCard>}

        <div className="wizard-actions"><button className="secondary-btn" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}><ArrowLeft/> Voltar</button><button className="primary-btn" onClick={next}>{step === 7 ? 'Começar' : 'Próximo'} <ArrowRight/></button></div>
      </main>
      {toast && <div className="toast"><span className="toast-icon"><Check/></span>{toast}</div>}
    </div>
  );
}

function StepCard({ title, subtitle, children }) { return <section className="step-card"><div className="step-heading"><span className="eyebrow">SHARKBOOK</span><h1>{title}</h1><p>{subtitle}</p></div>{children}</section>; }
function Field({ label, value, onChange, placeholder, type='text' }) { return <div className="field"><label>{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/></div>; }

function Completion({ data, onTest, onDashboard, toast }) { return <div className="app-shell completion-shell"><div className="completion-card"><div className="success-icon"><Check size={44}/></div><span className="eyebrow">CONFIGURAÇÃO CONCLUÍDA</span><h1>Tudo pronto para receber seu primeiro cliente</h1><p>A página da <strong>{data.business.name || 'sua barbearia'}</strong> já está preparada para começar.</p><div className="checklist"><div><CheckCircle2/> Serviços cadastrados</div><div><CheckCircle2/> Profissional configurado</div><div><CheckCircle2/> Horários definidos</div></div><button className="primary-btn large" onClick={onTest}><Scissors/> Fazer agendamento teste</button><button className="text-btn" onClick={onDashboard}>Entrar no painel</button></div>{toast && <div className="toast"><span className="toast-icon"><Check/></span>{toast}</div>}</div>; }
