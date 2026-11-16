const colours = {67731032375389:'Light Blue',67731032408157:'White',67731032440925:'Black',67731032473693:'Pastel Green',67731032506461:'Red',67731032539229:'Pink'};
const knives = {67731044794461:'Black',67731044827229:'White',67731044859997:'Light Blue',67731044892765:'Cream'};
const format = value => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(value/100);
let lines=[];
try { lines=JSON.parse(sessionStorage.getItem('smeg-current-basket') || '[]'); } catch {}
let total=0;
for (const [id,quantity] of Array.isArray(lines)?lines:[]) {
  if (!Number.isInteger(quantity)||quantity<1||quantity>10) continue;
  let label,price;
  if (colours[id]) {label='Collection — '+colours[id];price=11900;}
  else if (knives[id]) {label='Knife Set — '+knives[id];price=2990;}
  else if (Number(id)===67731024838749) {label='2-year extra warranty';price=1990;}
  else if (Number(id)===67731027525725) {label='Insured shipping';price=1490;}
  else continue;
  total+=price*quantity;
  const row=document.createElement('article'),name=document.createElement('span'),cost=document.createElement('strong');
  name.textContent=`${quantity} × ${label}`;cost.textContent=format(price*quantity);row.append(name,cost);document.querySelector('#summary').append(row);
}
const sum=document.createElement('h2');sum.textContent='Total: '+format(total);document.querySelector('#summary').append(sum);
