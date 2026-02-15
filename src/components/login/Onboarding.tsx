import Dashboard_block from "./Dashboard_block";
import Invoice_block from "./Invoice_block";
import Mask1 from "./Mask1";
import Mask2 from "./Mask2";
import Value_block from "./Value_block";

export default function Onboarding() {
    return (
        <div className="bg-[#008EFF] size-full  p-10 rounded-2xl flex flex-col gap-10 relative overflow-hidden">
            <div className="absolute  -top-[5rem] right-0">
                <Mask1 />
            </div>
            <div className="absolute -bottom-10 -left-70 ">
                <Mask2 />
            </div>
            <div className="absolute -bottom-10 -left-10 ">
                <Mask2 />
            </div>
            <div className="absolute bottom-0 -right-90 "> 
                <Mask2 />
            </div>
            <div className="flex flex-col gap-3">
                <p className="text-white text-4xl font-[700]">Built for
                    <br />
                    daily logistics operations</p>
                <p className="text-white/80 font-medium text-lg">Simple. Reliable. Built for everyday use.</p>
            </div>
            <div className=" h-full scale-75">
                <div className=" z-10 bg-[#FFFFFF4D] rounded-3xl border w-fit translate-y-[4rem] -translate-x-[10rem] shadow-2xl">
                    <Invoice_block />
                </div>
                <div className="bg-[#FFFFFF4D] rounded-3xl border w-fit ">
                    <Dashboard_block />
                </div>
                <div className=" z-1 bg-[#FFFFFF4D] rounded-3xl border w-fit -translate-y-[3rem] translate-x-[22rem] shadow-2xl">
                    <Value_block />
                </div>
            </div>
        </div>
    )
}
