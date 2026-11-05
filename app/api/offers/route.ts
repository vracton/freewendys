import {getSession,getPromotion,sessionFromRequest,jsonResponse,errorResponse} from '../../../lib/coupon-service';
export async function GET(request:Request){let session;try{session=await getSession(sessionFromRequest(request));return jsonResponse(await getPromotion(session),200,session,request)}catch(e){return errorResponse(e,session,request)}}
