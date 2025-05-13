import { LuSearch } from "react-icons/lu";
import { BiBell } from "react-icons/bi";
import { FaRegUser } from "react-icons/fa6";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { IoIosGitBranch } from "react-icons/io";
import { PiUsersThree } from "react-icons/pi";
import { LiaHandsHelpingSolid } from "react-icons/lia";
import { FiSettings } from "react-icons/fi";
import { HiOutlineCurrencyRupee } from "react-icons/hi";

export default function Dashboard({
  branchLength,
  clientLength,
  refresh,
  vendorLength,
}: {
  branchLength: number;
  clientLength: number;
  vendorLength: number;
  refresh: any;
}) {
  return (
    <>
      <div className="flex w-full justify-between">
        <div>
          <p className="text-sm font-medium text-[#707EAE]">Admin</p>
          <p className="text-3xl font-medium">Main Dashboard</p>
        </div>
        <div className="flex gap-5 rounded-full bg-white p-3 px-5">
          <div className="flex items-center gap-2 rounded-full bg-[#F4F7FE] p-2">
            <LuSearch size={18} />
            <input
              placeholder="Search"
              className="outline-none placeholder:font-medium"
            />
          </div>

          <button className="flex items-center" onClick={refresh}>
            <FiSettings size={22} color="#A3AED0" />
          </button>
          <div className="flex items-center">
            <BiBell size={24} color="#A3AED0" />
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Select>
              <SelectTrigger className="w-full border-none shadow-none">
                <FaRegUser size={27} color="#A3AED0" />
                <p className="text-black">Admin</p>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex gap-10">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-xs">Total Payments</p>
              <p className="text-xl">Rs. 25,000</p>
              <p className="text-[#05CD99]">
                +23%{" "}
                <span className="text-muted text-sm font-[400]">
                  since last month
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <IoIosGitBranch size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Branches</p>
              <p className="text-xl">{branchLength}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <PiUsersThree size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total Clients</p>
              <p className="text-xl">{clientLength}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <LiaHandsHelpingSolid size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Vendors</p>
              <p className="text-xl">{vendorLength}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
