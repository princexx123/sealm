import { createClient } from '@supabase/supabase-js';
import heroUrl from '../assets/sealm-hero.png';

document.querySelector('.hero').style.backgroundImage = `url(${heroUrl})`;
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configured = Boolean(url && key && !url.includes('SEU-PROJETO'));
const supabase = configured ? createClient(url, key) : null;
const picker = document.querySelector('#date-picker'), uploadDate = document.querySelector('#upload-date');
const adminModal = document.querySelector('#admin-modal'), loginModal = document.querySelector('#login-modal');
const input = document.querySelector('#image-input'), preview = document.querySelector('#upload-preview'), fileName = document.querySelector('#file-name');
let dayRecords = {};
const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
picker.value=uploadDate.value=localDate();
const pretty = date => new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date(`${date}T12:00:00`));
const toast = message => {const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3200)};

async function loadRankings(){
  document.querySelector('#ranking-grid').innerHTML='<div class="loading-card">Carregando registros...</div>';
  dayRecords={};
  if(configured){
    const {data,error}=await supabase.from('rankings').select('*').eq('ranking_date',picker.value);
    if(error) toast('Não foi possível carregar os rankings.'); else (data||[]).forEach(x=>dayRecords[x.reset_slot]=x);
  }
  render();
}
function render(){
  const date=picker.value;
  document.querySelector('#pretty-date').textContent=pretty(date);document.querySelector('#today-label').textContent=date===localDate()?'HOJE':'ARQUIVO';document.querySelector('#record-count').textContent=`${Object.keys(dayRecords).length} DE 2 REGISTROS`;
  document.querySelector('#ranking-grid').innerHTML=['05','18'].map(slot=>{const item=dayRecords[slot],night=slot==='18',title=night?'Reset das 18h':'Reset das 05h',period=night?'FECHAMENTO DA TARDE':'ABERTURA DA MANHÃ';return `<article class="rank-card ${night?'night':''}"><div class="rank-card-head"><span class="slot-icon">${night?'☾':'☀'}</span><div><small>${period}</small><b>${title}</b></div><time>${item?`Publicado ${new Date(item.published_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Aguardando print'}</time></div><div class="screenshot">${item?`<img src="${item.image_url}" alt="Ranking de ${date}, reset das ${slot}h" data-view="${slot}">`:`<div class="empty"><span>▧</span><b>Print ainda não publicado</b><small>Registro aguardando publicação.</small></div>`}</div><div class="rank-card-foot"><span>${item?'SALVO PERMANENTEMENTE':'SEM REGISTRO'}</span>${item?`<button data-view="${slot}">AMPLIAR ↗</button>`:'<span>PUBLICAÇÃO PELO PAINEL ADMIN</span>'}</div></article>`}).join('');
}
async function openAdmin(){
  if(!configured){alert('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env e na Vercel.');return}
  const {data}=await supabase.auth.getSession();
  if(!data.session){loginModal.showModal();return}
  uploadDate.value=picker.value;adminModal.showModal();
}
document.querySelectorAll('[data-open-admin]').forEach(b=>b.onclick=openAdmin);
document.querySelector('#close-login').onclick=()=>loginModal.close();
document.querySelector('#login-form').onsubmit=async e=>{e.preventDefault();const errorEl=document.querySelector('#login-error');errorEl.textContent='Entrando...';const {error}=await supabase.auth.signInWithPassword({email:document.querySelector('#admin-email').value,password:document.querySelector('#admin-password').value});if(error){errorEl.textContent='E-mail ou senha inválidos.';return}errorEl.textContent='';loginModal.close();uploadDate.value=picker.value;adminModal.showModal()};
function moveDay(delta){const d=new Date(`${picker.value}T12:00:00`);d.setDate(d.getDate()+delta);picker.value=localDate(d);loadRankings()}
document.querySelector('#prev-day').onclick=()=>moveDay(-1);document.querySelector('#next-day').onclick=()=>moveDay(1);picker.onchange=loadRankings;
document.addEventListener('click',e=>{const view=e.target.closest('[data-view]');if(view){const item=dayRecords[view.dataset.view];if(item){const box=document.querySelector('#lightbox');box.querySelector('img').src=item.image_url;box.querySelector('div').textContent=`${pretty(picker.value)} • Reset das ${view.dataset.view}h`;box.classList.add('open')}}});
document.querySelector('#lightbox button').onclick=()=>document.querySelector('#lightbox').classList.remove('open');document.querySelector('#lightbox').onclick=e=>{if(e.target.id==='lightbox')e.currentTarget.classList.remove('open')};
input.onchange=()=>{const f=input.files[0];if(!f)return;fileName.textContent=f.name;preview.src=URL.createObjectURL(f);preview.style.display='block'};
document.querySelector('#upload-form').addEventListener('submit',async e=>{e.preventDefault();const file=input.files[0];if(!file)return;if(file.size>10*1024*1024){alert('A imagem deve ter no máximo 10 MB.');return}const button=e.submitter;button.disabled=true;button.textContent='Enviando...';const date=uploadDate.value,slot=new FormData(e.currentTarget).get('reset'),ext=(file.name.split('.').pop()||'jpg').toLowerCase(),path=`${date}/reset-${slot}.${ext}`;const {data:{user}}=await supabase.auth.getUser();const {error:uploadError}=await supabase.storage.from('ranking-prints').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});if(uploadError){alert(`Erro no upload: ${uploadError.message}`);button.disabled=false;button.textContent='Salvar neste dia';return}const {data:publicData}=supabase.storage.from('ranking-prints').getPublicUrl(path);const imageUrl=`${publicData.publicUrl}?v=${Date.now()}`;const {error}=await supabase.from('rankings').upsert({ranking_date:date,reset_slot:slot,image_path:path,image_url:imageUrl,published_at:new Date().toISOString(),published_by:user.id},{onConflict:'ranking_date,reset_slot'});button.disabled=false;button.textContent='Salvar neste dia';if(error){alert(`Erro ao salvar: ${error.message}`);return}picker.value=date;adminModal.close();e.currentTarget.reset();uploadDate.value=date;preview.style.display='none';fileName.textContent='Arraste o print ou clique para selecionar';await loadRankings();toast('✓ Ranking salvo e publicado para todos!')});
function updateReset(){const now=new Date(),targets=[new Date(now),new Date(now)];targets[0].setHours(5,0,0,0);targets[1].setHours(18,0,0,0);let next=targets.find(t=>t>now);if(!next){next=new Date(now);next.setDate(next.getDate()+1);next.setHours(5,0,0,0)}const diff=next-now,h=Math.floor(diff/36e5),m=Math.floor(diff%36e5/6e4);document.querySelector('#next-reset').textContent=`${String(next.getHours()).padStart(2,'0')}:00 • em ${h}h ${String(m).padStart(2,'0')}min`}
updateReset();setInterval(updateReset,30000);loadRankings();
