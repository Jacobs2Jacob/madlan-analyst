export const formatNumber=(v:number)=>v.toLocaleString('he-IL'); 
export const formatMoney=(v:number|null)=>v==null?'—':`₪${Math.round(v).toLocaleString('he-IL')}`;
