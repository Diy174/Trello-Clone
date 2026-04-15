import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";

function CardDetailsModal({ cardId, boardId, onClose, onRefreshBoard }) {
  const [card, setCard] = useState(null);
  const [labels, setLabels] = useState([]);
  const [members, setMembers] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [availableLabels, setAvailableLabels] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItemTitles, setNewChecklistItemTitles] = useState({});

  useEffect(() => {
    fetchCardDetails();
    fetchAvailableData();
  }, [cardId, boardId]);

  const fetchCardDetails = async () => {
    try {
      const response = await axiosInstance.get(`/cards/${cardId}/details`);
      const cardData = response.data.card;

      setCard(cardData);
      setLabels(response.data.labels || []);
      setMembers(response.data.members || []);
      setChecklists(response.data.checklists || []);
      setTitle(cardData.title || "");
      setDescription(cardData.description || "");
      setDueDate(
        cardData.due_date ? new Date(cardData.due_date).toISOString().slice(0, 16) : ""
      );
    } catch (error) {
      console.error("Error fetching card details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableData = async () => {
    try {
      const [labelsRes, membersRes] = await Promise.all([
        axiosInstance.get(`/meta/boards/${boardId}/labels`),
        axiosInstance.get(`/meta/members`),
      ]);

      setAvailableLabels(labelsRes.data.labels || []);
      setAvailableMembers(membersRes.data.members || []);
    } catch (error) {
      console.error("Error fetching available labels/members:", error);
    }
  };

  const handleSaveCard = async () => {
    try {
      await axiosInstance.put(`/cards/${cardId}`, {
        title,
        description,
      });

      await axiosInstance.put(`/cards/${cardId}/due-date`, {
        due_date: dueDate ? dueDate.replace("T", " ") + ":00" : null,
      });

      fetchCardDetails();
      onRefreshBoard();
    } catch (error) {
      console.error("Error saving card details:", error);
    }
  };

  const handleToggleLabel = async (labelId) => {
    const alreadyAssigned = labels.some((label) => label.id === labelId);

    try {
      if (alreadyAssigned) {
        await axiosInstance.delete(`/cards/${cardId}/labels/${labelId}`);
      } else {
        await axiosInstance.post(`/cards/${cardId}/labels/${labelId}`);
      }

      fetchCardDetails();
      onRefreshBoard();
    } catch (error) {
      console.error("Error toggling label:", error);
    }
  };

  const handleToggleMember = async (memberId) => {
    const alreadyAssigned = members.some((member) => member.id === memberId);

    try {
      if (alreadyAssigned) {
        await axiosInstance.delete(`/cards/${cardId}/members/${memberId}`);
      } else {
        await axiosInstance.post(`/cards/${cardId}/members/${memberId}`);
      }

      fetchCardDetails();
      onRefreshBoard();
    } catch (error) {
      console.error("Error toggling member:", error);
    }
  };

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;

    try {
      await axiosInstance.post(`/cards/${cardId}/checklists`, {
        title: newChecklistTitle,
      });
      setNewChecklistTitle("");
      fetchCardDetails();
    } catch (error) {
      console.error("Error creating checklist:", error);
    }
  };

  const handleCreateChecklistItem = async (checklistId) => {
    const itemTitle = newChecklistItemTitles[checklistId];

    if (!itemTitle || !itemTitle.trim()) return;

    try {
      await axiosInstance.post(`/cards/checklists/${checklistId}/items`, {
        title: itemTitle,
      });

      setNewChecklistItemTitles((prev) => ({
        ...prev,
        [checklistId]: "",
      }));

      fetchCardDetails();
    } catch (error) {
      console.error("Error creating checklist item:", error);
    }
  };

  const handleToggleChecklistItem = async (itemId, currentStatus) => {
    try {
      await axiosInstance.put(`/cards/checklist-items/${itemId}`, {
        is_completed: !currentStatus,
      });

      fetchCardDetails();
    } catch (error) {
      console.error("Error updating checklist item:", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-3xl">
          Loading card details...
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-100 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Card Details</h2>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-3 py-1 rounded-lg"
          >
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <button
              onClick={handleSaveCard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Save Card Details
            </button>

            <div>
              <h3 className="text-lg font-bold mb-3">Checklist</h3>

              <div className="flex gap-2 mb-3">
                <input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="New checklist title"
                  className="flex-1 border rounded-lg p-2"
                />
                <button
                  onClick={handleCreateChecklist}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg"
                >
                  Add Checklist
                </button>
              </div>

              <div className="space-y-4">
                {checklists.map((checklist) => (
                  <div key={checklist.id} className="bg-white rounded-xl p-4 shadow">
                    <h4 className="font-semibold mb-3">{checklist.title}</h4>

                    <div className="space-y-2 mb-3">
                      {checklist.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={!!item.is_completed}
                            onChange={() =>
                              handleToggleChecklistItem(item.id, item.is_completed)
                            }
                          />
                          <span
                            className={
                              item.is_completed ? "line-through text-slate-400" : ""
                            }
                          >
                            {item.title}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={newChecklistItemTitles[checklist.id] || ""}
                        onChange={(e) =>
                          setNewChecklistItemTitles((prev) => ({
                            ...prev,
                            [checklist.id]: e.target.value,
                          }))
                        }
                        placeholder="New checklist item"
                        className="flex-1 border rounded-lg p-2"
                      />
                      <button
                        onClick={() => handleCreateChecklistItem(checklist.id)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold mb-3">Labels</h3>
              <div className="space-y-2">
                {availableLabels.map((label) => {
                  const selected = labels.some((l) => l.id === label.id);

                  return (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-white ${
                        selected ? "ring-4 ring-black/30" : ""
                      }`}
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3">Members</h3>
              <div className="space-y-2">
                {availableMembers.map((member) => {
                  const selected = members.some((m) => m.id === member.id);

                  return (
                    <button
                      key={member.id}
                      onClick={() => handleToggleMember(member.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-white text-slate-800"
                      }`}
                    >
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3">Current Summary</h3>
              <div className="bg-white rounded-xl p-4 shadow space-y-3">
                <div>
                  <p className="text-sm font-semibold">Assigned Labels</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {labels.length > 0 ? (
                      labels.map((label) => (
                        <span
                          key={label.id}
                          className="px-3 py-1 rounded-full text-white text-sm"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No labels assigned</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Assigned Members</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {members.length > 0 ? (
                      members.map((member) => (
                        <span
                          key={member.id}
                          className="px-3 py-1 rounded-full bg-slate-200 text-sm"
                        >
                          {member.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No members assigned</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Due Date</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {card.due_date ? new Date(card.due_date).toLocaleString() : "No due date"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardDetailsModal;