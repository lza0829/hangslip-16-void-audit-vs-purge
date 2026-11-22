import { useEffect, useState } from "react";
import { api } from "../api";

// 废票留档：错贴挂牌进入终态「已作废」。票籍与衣物件保留，按号可回看；
// 水位出途；工作列表不再出现；废票流水与票籍同事务同命运。
const 不可废 = ["已取", "丢失隔离", "已作废"];

export default function Void() {
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reasons, setReasons] = useState({});
  const [lookup, setLookup] = useState("");
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const [all, voided] = await Promise.all([api.挂牌列表(), api.废票流水()]);
    setRows(all.filter((r) => !不可废.includes(r.status)));
    setLogs(voided);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  async function voidIt(ticket_no) {
    setMsg("");
    try {
      await api.作废(ticket_no, {
        reason: reasons[ticket_no] || "",
        operator: "店长",
      });
      setMsg(`${ticket_no} 已作废留档，按号仍可回看`);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function review(no) {
    const ticket_no = (no ?? lookup).trim();
    if (!ticket_no) return;
    setMsg("");
    setDetail(null);
    try {
      setDetail(await api.挂牌详情(ticket_no));
      setLookup(ticket_no);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <>
      <section className="panel">
        <h3>错贴作废</h3>
        <p className={`msg ${msg.includes("已作废") ? "ok" : ""}`}>{msg}</p>
        <table>
          <thead>
            <tr>
              <th>票号</th>
              <th>门店</th>
              <th>顾客</th>
              <th>现行</th>
              <th>废票原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticket_no}>
                <td>{r.ticket_no}</td>
                <td>{r.store_code}</td>
                <td>{r.customer_name}</td>
                <td>
                  <span className={`badge ${r.status}`}>{r.status}</span>
                </td>
                <td>
                  <input
                    placeholder="必填，留档可追"
                    value={reasons[r.ticket_no] || ""}
                    onChange={(e) =>
                      setReasons({ ...reasons, [r.ticket_no]: e.target.value })
                    }
                  />
                </td>
                <td>
                  <button type="button" onClick={() => voidIt(r.ticket_no)}>
                    作废留档
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h3>按号回看</h3>
        <div className="row">
          <input
            placeholder="输入票号，废票后仍可回看"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
          />
          <button type="button" className="ghost" onClick={() => review()}>
            回看
          </button>
        </div>
        {detail && (
          <>
            <p>
              <span className={`badge ${detail.status}`}>{detail.status}</span>{" "}
              {detail.ticket_no} · {detail.store_code} · {detail.customer_name} ·
              承诺 {detail.due_date}
            </p>
            <table>
              <thead>
                <tr>
                  <th>衣物</th>
                  <th>件数</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.garment}</td>
                    <td>{i.qty}</td>
                    <td>{i.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>流转</th>
                  <th>操作员</th>
                  <th>摘要</th>
                </tr>
              </thead>
              <tbody>
                {detail.events.map((e) => (
                  <tr key={e.id}>
                    <td>{e.occurred_at}</td>
                    <td>
                      {e.from_status ?? "—"} → {e.to_status}
                    </td>
                    <td>{e.operator}</td>
                    <td>{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="panel">
        <h3>废票流水</h3>
        <table>
          <thead>
            <tr>
              <th>票号</th>
              <th>原状态</th>
              <th>原因</th>
              <th>操作员</th>
              <th>时间</th>
              <th>票籍</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((r) => (
              <tr key={r.id}>
                <td>{r.ticket_no}</td>
                <td>
                  <span className={`badge ${r.prev_status}`}>{r.prev_status}</span>
                </td>
                <td>{r.reason}</td>
                <td>{r.operator}</td>
                <td>{r.voided_at}</td>
                <td>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => review(r.ticket_no)}
                  >
                    回看终态
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
