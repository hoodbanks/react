// src/components/RequestPushBanner.jsx
import { useEffect, useState } from "react";
import { pushPermission, requestPushPermission } from "../lib/orderNotifications";

const DISMISS_KEY = "vendor_push_banner_dismissed";

export default function RequestPushBanner() {
  const [perm, setPerm] = useState(pushPermission());
  const [dismissed, setDismissed] = useState(
    localStorage.getItem(DISMISS_KEY) === "1"
  );

  useEffect(() => {
    const p = pushPermission();
    setPerm(p);
  }, []);

  if (perm !== "default" || dismissed || perm === "unsupported") return null;

  const allow = async () => {
    const res = await requestPushPermission();
    setPerm(res);
    if (res !== "granted") {
      // if denied, don't nag again this session
      localStorage.setItem(DISMISS_KEY, "1");
      setDismissed(true);
    }
  };
  const hide = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 mt-3">
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
        <div className="text-emerald-700 font-medium">
          Enable desktop notifications to be alerted when a new order arrives.
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={allow}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
          >
            Enable
          </button>
          <button
            onClick={hide}
            className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
