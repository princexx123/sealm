import { createClient } from '@supabase/supabase-js';
import heroUrl from '../assets/shiltz-ranking-hero.png';

document.querySelector('.hero').style.backgroundImage = `url(${heroUrl})`;
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configured = Boolean(url && key && !url.includes('SEU-PROJETO'));
const supabase = configured ? createClient(url, key) : null;
const picker = document.querySelector('#date-picker'), uploadDate = document.querySelector('#upload-date');
const adminModal = document.querySelector('#admin-modal'), loginModal = document.querySelector('#login-modal');
const input = document.querySelector('#image-input'), input2 = document.querySelector('#image-input-2'), preview = document.querySelector('#upload-preview'), preview2 = document.querySelector('#upload-preview-2'), fileName = document.querySelector('#file-name'), fileName2 = document.querySelector('#file-name-2');
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
  document.querySelector('#ranking-grid').innerHTML=['05','18'].map(slot=>{const item=dayRecords[slot],night=slot==='18',title=night?'Reset das 18h':'Reset das 05h',period=night?'FECHAMENTO DA TARDE':'ABERTURA DA MANHÃ',images=item?[item.image_url,item.image_url_2].filter(Boolean):[];return `<article class="rank-card ${night?'night':''}"><span class="card-number">${slot}</span><div class="rank-card-head"><span class="slot-icon">${night?'☾':'☀'}</span><div><small>${period}</small><b>${title}</b></div><span class="cycle-chip"><i></i>${item?'REGISTRADO':'PENDENTE'}</span><time>${item?`Publicado ${new Date(item.published_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Aguardando print'}</time></div><div class="screenshot ${item?'has-print':''}" ${item?`style="--shot-bg:url('${images[0]}')"`:''}>${item?`<div class="slides" data-slot="${slot}">${images.map((src,i)=>`<img class="${i===0?'active':''}" src="${src}" alt="Ranking parte ${i+1}, reset das ${slot}h" data-view="${slot}" data-index="${i}">`).join('')}</div>${images.length>1?`<button class="slide-arrow prev" data-slide="-1" data-slot="${slot}">‹</button><button class="slide-arrow next" data-slide="1" data-slot="${slot}">›</button><span class="slide-count" data-count="${slot}">1 / ${images.length}</span>`:''}`:`<div class="empty"><div class="empty-glyph"><span>▧</span><i></i><i></i></div><b>Print ainda não publicado</b><small>O registro deste ciclo aparecerá aqui assim que for enviado.</small><div class="empty-meta"><span>◷ RESET ${slot}:00</span><span>◇ 2 PARTES</span></div></div>`}</div><div class="rank-card-foot"><span>${item?'◆ 2 PARTES SALVAS PERMANENTEMENTE':'○ SEM REGISTRO PARA ESTE CICLO'}</span>${item?`<button data-view="${slot}" data-active-view>VER PARTE ATUAL EM TELA CHEIA ↗</button>`:'<span>AGUARDANDO ATUALIZAÇÃO</span>'}</div></article>`}).join('');
}
async function openAdmin(){
  if(!configured){alert('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env e na Vercel.');return}
  const {data}=await supabase.auth.getSession();
  if(!data.session){loginModal.showModal();return}
  uploadDate.value=picker.value;adminModal.showModal();
}
document.addEventListener('keydown',event=>{if(event.ctrlKey&&event.altKey&&event.key.toLowerCase()==='s'){event.preventDefault();openAdmin()}});
document.querySelectorAll('[data-close-admin]').forEach(button=>button.onclick=()=>adminModal.close());
document.querySelector('#close-login').onclick=()=>loginModal.close();
document.querySelector('#login-form').onsubmit=async e=>{e.preventDefault();const errorEl=document.querySelector('#login-error');errorEl.textContent='Entrando...';const {error}=await supabase.auth.signInWithPassword({email:document.querySelector('#admin-email').value,password:document.querySelector('#admin-password').value});if(error){errorEl.textContent='E-mail ou senha inválidos.';return}errorEl.textContent='';loginModal.close();uploadDate.value=picker.value;adminModal.showModal()};
function moveDay(delta){const d=new Date(`${picker.value}T12:00:00`);d.setDate(d.getDate()+delta);picker.value=localDate(d);loadRankings()}
document.querySelector('#prev-day').onclick=()=>moveDay(-1);document.querySelector('#next-day').onclick=()=>moveDay(1);picker.onchange=loadRankings;
document.addEventListener('click',e=>{const slide=e.target.closest('[data-slide]');if(slide){const wrap=document.querySelector(`.slides[data-slot="${slide.dataset.slot}"]`),imgs=[...wrap.querySelectorAll('img')],current=imgs.findIndex(x=>x.classList.contains('active')),next=(current+Number(slide.dataset.slide)+imgs.length)%imgs.length;imgs.forEach((img,i)=>img.classList.toggle('active',i===next));wrap.closest('.screenshot').style.setProperty('--shot-bg',`url('${imgs[next].src}')`);document.querySelector(`[data-count="${slide.dataset.slot}"]`).textContent=`${next+1} / ${imgs.length}`;return}const view=e.target.closest('[data-view]');if(view){const item=dayRecords[view.dataset.view];if(item){const images=[item.image_url,item.image_url_2].filter(Boolean),active=view.hasAttribute('data-active-view')?view.closest('.rank-card').querySelector('.slides img.active'):view,index=Number(active.dataset.index||0),box=document.querySelector('#lightbox');box.querySelector('img').src=images[index];box.querySelector('div').textContent=`${pretty(picker.value)} • Reset das ${view.dataset.view}h • Parte ${index+1}`;box.classList.add('open')}}});
document.querySelector('#lightbox button').onclick=()=>document.querySelector('#lightbox').classList.remove('open');document.querySelector('#lightbox').onclick=e=>{if(e.target.id==='lightbox')e.currentTarget.classList.remove('open')};
input.onchange=()=>{const f=input.files[0];if(!f)return;fileName.textContent=f.name;preview.src=URL.createObjectURL(f);preview.style.display='block'};
input2.onchange=()=>{const f=input2.files[0];if(!f)return;fileName2.textContent=f.name;preview2.src=URL.createObjectURL(f);preview2.style.display='block'};
document.querySelector('#upload-form').addEventListener('submit',async e=>{e.preventDefault();const files=[input.files[0],input2.files[0]];if(files.some(file=>!file))return;if(files.some(file=>file.size>10*1024*1024)){alert('Cada imagem deve ter no máximo 10 MB.');return}const button=e.submitter;button.disabled=true;button.textContent='Enviando 2 prints...';const date=uploadDate.value,slot=new FormData(e.currentTarget).get('reset'),paths=files.map((file,i)=>`${date}/reset-${slot}-parte-${i+1}.${(file.name.split('.').pop()||'jpg').toLowerCase()}`),urls=[];for(let i=0;i<files.length;i++){const {error:uploadError}=await supabase.storage.from('ranking-prints').upload(paths[i],files[i],{upsert:true,contentType:files[i].type,cacheControl:'3600'});if(uploadError){alert(`Erro no print ${i+1}: ${uploadError.message}`);button.disabled=false;button.textContent='Salvar neste dia';return}const {data}=supabase.storage.from('ranking-prints').getPublicUrl(paths[i]);urls.push(`${data.publicUrl}?v=${Date.now()}`)}const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from('rankings').upsert({ranking_date:date,reset_slot:slot,image_path:paths[0],image_url:urls[0],image_path_2:paths[1],image_url_2:urls[1],published_at:new Date().toISOString(),published_by:user.id},{onConflict:'ranking_date,reset_slot'});button.disabled=false;button.textContent='Salvar neste dia';if(error){alert(`Erro ao salvar: ${error.message}`);return}picker.value=date;adminModal.close();e.currentTarget.reset();uploadDate.value=date;[preview,preview2].forEach(img=>img.style.display='none');fileName.textContent='Primeira parte do ranking';fileName2.textContent='Segunda parte do ranking';await loadRankings();toast('✓ Os 2 prints foram publicados!')});
function updateReset(){const now=new Date(),targets=[new Date(now),new Date(now)];targets[0].setHours(5,0,0,0);targets[1].setHours(18,0,0,0);let next=targets.find(t=>t>now);if(!next){next=new Date(now);next.setDate(next.getDate()+1);next.setHours(5,0,0,0)}const diff=next-now,h=Math.floor(diff/36e5),m=Math.floor(diff%36e5/6e4);document.querySelector('#next-reset').textContent=`${String(next.getHours()).padStart(2,'0')}:00 • em ${h}h ${String(m).padStart(2,'0')}min`}
updateReset();setInterval(updateReset,30000);loadRankings();

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
