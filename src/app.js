import { createClient } from '@supabase/supabase-js';
import heroUrl from '../assets/shiltz-ranking-hero-v3.png';

document.querySelector('#hero-art').src = heroUrl;
document.body.classList.add(location.pathname.replace(/\/$/,'')==='/calculadora'?'calculator-page':'home-page');
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
  document.querySelector('#ranking-grid').innerHTML=['05','18'].map(slot=>{const item=dayRecords[slot],night=slot==='18',title=night?'Reset das 18h':'Reset das 05h',period=night?'FECHAMENTO DA TARDE':'ABERTURA DA MANHÃ',images=item?[item.image_url,item.image_url_2].filter(Boolean):[];return `<article class="rank-card ${night?'night':''}"><span class="card-number">${slot}</span><div class="rank-card-head"><span class="slot-icon">${night?'☾':'☀'}</span><div><small>${period}</small><b>${title}</b></div><span class="cycle-chip"><i></i>${item?'REGISTRADO':'PENDENTE'}</span><time>${item?`Publicado ${new Date(item.published_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Aguardando print'}</time></div><div class="screenshot ${item?'has-print':''}" ${item?`style="--shot-bg:url('${images[0]}')"`:''}>${item?`<div class="slides" data-slot="${slot}">${images.map((src,i)=>`<img class="${i===0?'active':''}" src="${src}" alt="Ranking parte ${i+1}, reset das ${slot}h" data-view="${slot}" data-index="${i}">`).join('')}</div>${images.length>1?`<button class="slide-arrow prev" data-slide="-1" data-slot="${slot}">‹</button><button class="slide-arrow next" data-slide="1" data-slot="${slot}">›</button><span class="slide-count" data-count="${slot}">1 / ${images.length}</span>`:''}`:`<div class="empty"><div class="empty-glyph"><span>▧</span><i></i><i></i></div><b>Print ainda não publicado</b><small>O registro deste ciclo aparecerá aqui assim que for enviado.</small><div class="empty-meta"><span>◷ RESET ${slot}:00</span><span>◇ 2 PARTES</span></div></div>`}</div><div class="rank-card-foot"><span>${item?'◆ 2 PARTES SALVAS PERMANENTEMENTE':'○ SEM REGISTRO PARA ESTE CICLO'}</span>${item?`<button data-view="${slot}" data-active-view>VER EM TELA CHEIA ↗</button>`:'<span>AGUARDANDO ATUALIZAÇÃO</span>'}</div></article>`}).join('');
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

const bosses=['Xamã do Céu','Gato de Botas Douradas','Grande Rei Rei Moomoo de Outro Mundo','Gotas de Deus','Galadriel','Aememae do Meio Inverno','Raychak III da Âncora de Prata','Hanaiel','Solar, Devota do Sol','Gariel Escurecido','Caranguejo da Fenda Completa','Kelberus das Correntes Prisionais','Kelberus','Kelberus Governante Subterrâneo','Kelberus da Corrente Vermelha Subterrânea','Kelberus do Brilho Vermelho'];
const bossTables={'Xamã do Céu':[
  {label:'Classificação 1',contribution:66,shiltz:264},{label:'Classificação 2 ~ Classificação 3',contribution:53,shiltz:212},{label:'Classificação 4 ~ Classificação 5',contribution:43,shiltz:172},{label:'Classificação 6 ~ Classificação 10',contribution:35,shiltz:140},{label:'Classificação 11 ~ Classificação 20',contribution:28,shiltz:112},{label:'Classificação 21 ~ Classificação 30',contribution:23,shiltz:92},{label:'Classificação 31 ~ Classificação 40',contribution:19,shiltz:76},{label:'Classificação 41 ~ Classificação 50',contribution:16,shiltz:64},{label:'Classificação 51 ~ Classificação 60',contribution:13,shiltz:52}
]};
const tierLabels=['Classificação 1','Classificação 2 ~ Classificação 3','Classificação 4 ~ Classificação 5','Classificação 6 ~ Classificação 10','Classificação 11 ~ Classificação 20','Classificação 21 ~ Classificação 30','Classificação 31 ~ Classificação 40','Classificação 41 ~ Classificação 50','Classificação 51 ~ Classificação 60'];
const makeTiers=values=>values.map(([contribution,shiltz],index)=>({label:tierLabels[index],contribution,shiltz}));
Object.assign(bossTables,{
  'Gato de Botas Douradas':makeTiers([[147,588],[118,472],[95,380],[76,304],[61,244],[49,196],[40,160],[32,128],[26,104]]),
  'Grande Rei Rei Moomoo de Outro Mundo':makeTiers([[186,744],[149,596],[120,480],[96,384],[77,308],[62,248],[50,200],[40,160],[32,128]]),
  'Gotas de Deus':makeTiers([[228,912],[183,732],[147,588],[118,472],[95,380],[76,304],[61,244],[49,196],[40,160]]),
  'Galadriel':makeTiers([[700,2800],[560,2240],[448,1792],[359,1436],[288,1152],[231,924],[185,740],[148,592],[119,476]]),
  'Aememae do Meio Inverno':makeTiers([[279,1116],[224,896],[180,720],[144,576],[116,464],[93,372],[75,300],[60,240],[48,192]]),
  'Raychak III da Âncora de Prata':makeTiers([[438,1752],[351,1404],[281,1124],[225,900],[180,720],[144,576],[116,464],[93,372],[75,300]]),
  'Hanaiel':makeTiers([[741,2964],[593,2372],[475,1900],[380,1520],[304,1216],[244,976],[196,784],[157,628],[126,504]]),
  'Solar, Devota do Sol':makeTiers([[606,2424],[485,1940],[388,1552],[311,1244],[249,996],[200,800],[160,640],[128,512],[103,412]]),
  'Gariel Escurecido':makeTiers([[645,2580],[516,2064],[413,1652],[331,1324],[265,1060],[212,848],[170,680],[136,544],[109,436]]),
  'Caranguejo da Fenda Completa':makeTiers([[699,2796],[560,2240],[448,1792],[359,1436],[288,1152],[231,924],[185,740],[148,592],[119,476]])
});
const bossSelect=document.querySelector('#boss-select'),tierSelect=document.querySelector('#tier-select'),qtyInput=document.querySelector('#boss-qty'),calculatorCard=document.querySelector('.calculator-card');
bossSelect.innerHTML=bosses.map(name=>`<option value="${name}">${name}${bossTables[name]?'':' — aguardando tabela'}</option>`).join('');
function loadBossTiers(){const table=bossTables[bossSelect.value];calculatorCard.classList.toggle('unavailable',!table);tierSelect.disabled=!table;document.querySelector('#add-calculation').disabled=!table;tierSelect.innerHTML=table?table.map((tier,index)=>`<option value="${index}">${tier.label}</option>`).join(''):'<option>Tabela ainda não disponível</option>';calculateBossPoints()}
function calculateBossPoints(){const table=bossTables[bossSelect.value];if(!table)return;const tier=table[Number(tierSelect.value)||0],qty=Math.max(1,Math.min(999,Number(qtyInput.value)||1));qtyInput.value=qty;document.querySelector('#result-contribution').textContent=(tier.contribution*qty).toLocaleString('pt-BR');document.querySelector('#result-shiltz').textContent=(tier.shiltz*qty).toLocaleString('pt-BR');document.querySelector('#result-total').textContent=((tier.contribution+tier.shiltz)*qty).toLocaleString('pt-BR');document.querySelector('#unit-contribution').textContent=`${tier.contribution} por derrota`;document.querySelector('#unit-shiltz').textContent=`${tier.shiltz} por derrota`;document.querySelector('#result-summary').textContent=`${qty} ${qty===1?'derrota calculada':'derrotas calculadas'}`}
bossSelect.onchange=loadBossTiers;tierSelect.onchange=calculateBossPoints;qtyInput.oninput=calculateBossPoints;document.querySelector('#qty-minus').onclick=()=>{qtyInput.value=Math.max(1,Number(qtyInput.value)-1);calculateBossPoints()};document.querySelector('#qty-plus').onclick=()=>{qtyInput.value=Math.min(999,Number(qtyInput.value)+1);calculateBossPoints()};loadBossTiers();

let calculationEntries=[];
function renderCalculationList(){const container=document.querySelector('#calculation-items');container.innerHTML=calculationEntries.length?calculationEntries.map((entry,index)=>`<article class="calc-item"><div><b>${entry.qty}× ${entry.boss}</b><small>${entry.tier}</small></div><strong>${entry.total.toLocaleString('pt-BR')} pts</strong><button type="button" data-remove-calc="${index}" aria-label="Remover">×</button></article>`).join(''):'<p>Nenhum chefe adicionado.</p>';const contribution=calculationEntries.reduce((sum,item)=>sum+item.contribution,0),shiltz=calculationEntries.reduce((sum,item)=>sum+item.shiltz,0);document.querySelector('#grand-contribution').textContent=contribution.toLocaleString('pt-BR');document.querySelector('#grand-shiltz').textContent=shiltz.toLocaleString('pt-BR');document.querySelector('#grand-total').textContent=(contribution+shiltz).toLocaleString('pt-BR')}
document.querySelector('#add-calculation').onclick=()=>{const table=bossTables[bossSelect.value];if(!table)return;const tier=table[Number(tierSelect.value)||0],qty=Math.max(1,Number(qtyInput.value)||1);calculationEntries.push({boss:bossSelect.value,tier:tier.label,qty,contribution:tier.contribution*qty,shiltz:tier.shiltz*qty,total:(tier.contribution+tier.shiltz)*qty});renderCalculationList()};
document.querySelector('#clear-calculations').onclick=()=>{calculationEntries=[];renderCalculationList()};document.querySelector('#calculation-items').onclick=event=>{const button=event.target.closest('[data-remove-calc]');if(!button)return;calculationEntries.splice(Number(button.dataset.removeCalc),1);renderCalculationList()};
