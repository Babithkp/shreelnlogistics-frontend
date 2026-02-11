import companyLogo from "./assets/logisticsLogo.svg"
import Mask1 from "./components/login/Mask1"
import Mask2 from "./components/login/Mask2"
export default function Loader() {
    return (
        <main className="bg-[#D7EDFF] h-screen p-10">
            <section className="bg-[#008EFF] rounded-2xl flex justify-center items-center h-full w-full flex-col gap-5 relative overflow-hidden">
                <div className="absolute  top-0 right-0 ">
                    <Mask1 />
                </div>
                <div className="absolute  top-0 -left-30  -rotate-90"> 
                    <Mask1 />
                </div>
                <div className="absolute -bottom-0 -left-70 ">
                    <Mask2 />
                </div>
                <div className="absolute -bottom-0 left-50 ">
                    <Mask2 />
                </div>
                <div className="absolute bottom-0 -right-50 ">
                    <Mask2 />
                </div>
                <img src={companyLogo} alt="logo" className="w-[400px]" />
                <p className="text-white text-5xl font-semibold">Welcome Shree LN Logistics</p>
                <div className="text-white text-2xl text-center font-medium">
                    <p>Initializing...</p>
                    <p>Loading...</p>
                    <p className="text-white/50">Setting up...</p>
                    <p className="text-white/50">Ready...</p>
                </div>
            </section>
        </main>
    )
}
