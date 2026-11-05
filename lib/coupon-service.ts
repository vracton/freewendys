import md5 from 'blueimp-md5';
const BASE='https://wqserver.81monkeys.com/fresh-quest-coupons-prod/api/';
export type Json=Record<string,unknown>;
export class CouponError extends Error{status:number;kind?:string;constructor(message:string,status=502,kind?:string){super(message);this.status=status;this.kind=kind}}
export function requestKey(now=new Date()){return md5(now.toISOString().replace(/\D/g,'').slice(0,12)+'e67Y2i')}
export async function upstream(path:string,query?:Record<string,string>,fetcher:typeof fetch=fetch):Promise<Json>{
 const url=new URL(path,BASE);if(query)url.search=new URLSearchParams(query).toString();
 let response:Response;
 try{response=await fetcher(url,{method:'GET',headers:{Accept:'application/json','X-Pmmf-Ac':requestKey()},signal:AbortSignal.timeout(15000),cache:'no-store'})}catch{throw new CouponError('The reward server is taking a break. Please try again in a moment.',503)}
 if(!response.ok)throw new CouponError(response.status===429?'Too many requests. Please wait a moment and try again.':'The reward server is unavailable. Please try again shortly.',response.status===429?429:502);
 try{const data=await response.json();if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data as Json}catch{throw new CouponError('The reward server returned an unexpected response. Please try again.')}
}
export async function getSession(existing?:string,fetcher:typeof fetch=fetch){
 if(existing&&existing.length<=512&&!/[\r\n]/.test(existing))return existing;
 const result=await upstream('app/session',undefined,fetcher);const id=result.session_id;
 if((typeof id!=='string'&&typeof id!=='number')||!String(id)||String(id).length>512)throw new CouponError('A reward session could not be started. Please try again.');return String(id);
}
export function promotion(data:Json){const status=String(data.promotion_status);if(status==='1')return {status:'active' as const,message:'The promotion is active. Individual rewards are checked when you claim.'};if(status==='2')return {status:'unavailable' as const,message:'No reward codes are available right now. Please check back later.'};if(status==='3')return {status:'ended' as const,message:'This reward promotion has ended. Check the Wendy’s app for other offers.'};throw new CouponError('Promotion availability could not be confirmed. Please try again.')}
export async function getPromotion(session:string,fetcher:typeof fetch=fetch){return promotion(await upstream('app/init',{session_id:session},fetcher))}
export async function retrieveCoupon(session:string,index:number,fetcher:typeof fetch=fetch){
 if(!Number.isInteger(index)||index<0||index>4)throw new CouponError('Choose a reward from the five available options.',400);
 const current=await getPromotion(session,fetcher);
 if(current.status!=='active')throw new CouponError(current.message,409,current.status);
 const data=await upstream('coupons/retrieve',{session_id:session,type:String(index+1)},fetcher);
 if(data.result!=='successful'||typeof data.coupon_code!=='string'||!data.coupon_code.trim())throw new CouponError('No code is available for this reward right now. Try another reward or check back later.',409);
 if(data.coupon_code.length>2048)throw new CouponError('The reward server returned an unexpected code.');
 return data.coupon_code;
}
export function sessionFromRequest(request:Request){const match=request.headers.get('cookie')?.match(/(?:^|;\s*)wq_session=([^;]*)/);if(!match)return undefined;try{return decodeURIComponent(match[1])}catch{return undefined}}
export function jsonResponse(data:unknown,status=200,session?:string,request?:Request){const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});if(session)headers.set('Set-Cookie',`wq_session=${encodeURIComponent(session)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${request&&new URL(request.url).protocol==='https:'?'; Secure':''}`);return new Response(JSON.stringify(data),{status,headers})}
export function errorResponse(error:unknown,session?:string,request?:Request){const e=error instanceof CouponError?error:new CouponError('Something went wrong. Please try again.');return jsonResponse({error:e.message,...(e.kind?{status:e.kind}:{})},e.status,session,request)}
