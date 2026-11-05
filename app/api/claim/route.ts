import {getSession,retrieveCoupon,sessionFromRequest,jsonResponse,errorResponse,CouponError} from '../../../lib/coupon-service';
export async function POST(request:Request){let session;try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new CouponError('Please claim rewards directly from this website.',403);
 if(!request.headers.get('content-type')?.includes('application/json'))throw new CouponError('Expected a JSON request.',415);
 if(Number(request.headers.get('content-length')||0)>1024)throw new CouponError('Request is too large.',413);
 const text=await request.text();if(text.length>1024)throw new CouponError('Request is too large.',413);let data;try{data=JSON.parse(text)}catch{throw new CouponError('Invalid request.',400)}
 if(!data||!Number.isInteger(data.index)||data.index<0||data.index>4)throw new CouponError('Choose a reward from 0 through 4.',400);
 session=await getSession(sessionFromRequest(request));const code=await retrieveCoupon(session,data.index);
 return jsonResponse({code},200,session,request);
 }catch(e){return errorResponse(e,session,request)}}
