import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  DndContext,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import ListColumn from "../components/list/ListColumn";
import CardItem from "../components/card/CardItem";
import CardDetailsModal from "../components/modal/CardDetailsModal";


function BoardPage() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitles, setNewCardTitles] = useState({});
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [availableLabels, setAvailableLabels] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);

  useEffect(() => {
    fetchBoardDetails();
    fetchFilterData();
  }, [id]);

  const getFilteredCards = (cards) => {
    return cards.filter((card) => {
      const matchesSearch = card.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesLabel =
        !selectedLabel || card.labelIds?.includes(Number(selectedLabel));

      const matchesMember =
        !selectedMember || card.memberIds?.includes(Number(selectedMember));

      const matchesDue =
        !dueFilter ||
        (dueFilter === "today" &&
          card.due_date &&
          new Date(card.due_date).toDateString() === new Date().toDateString()) ||
        (dueFilter === "overdue" &&
          card.due_date &&
          new Date(card.due_date) < new Date());

      return matchesSearch && matchesLabel && matchesMember && matchesDue;
    });
  };

  const fetchBoardDetails = async () => {
    try {
      const response = await axiosInstance.get(`/boards/${id}`);
      setBoard(response.data.board);
      setLists(response.data.lists || []);
    } catch (error) {
      console.error("Error fetching board details:", error);
    } finally {
      setLoading(false);
    }
  };

  const persistListOrder = async (updatedLists) => {
    try {
      await axiosInstance.put("/lists/reorder", {
        lists: updatedLists.map((list, index) => ({
          id: list.id,
          position: index + 1,
        })),
      });
    } catch (error) {
      console.error("Error saving list order:", error);
    }
  };

  const persistCardOrder = async (updatedLists) => {
    try {
      const cardsPayload = updatedLists.flatMap((list) =>
        list.cards.map((card, index) => ({
          id: card.id,
          list_id: list.id,
          position: index + 1,
        }))
      );

      await axiosInstance.put("/cards/reorder", {
        cards: cardsPayload,
      });
    } catch (error) {
      console.error("Error saving card order:", error);
    }
  };

  const findCardLocation = (cardId, currentLists = lists) => {
    for (const list of currentLists) {
      const cardIndex = list.cards.findIndex((card) => card.id === cardId);
      if (cardIndex !== -1) {
        return { listId: list.id, cardIndex };
      }
    }
    return null;
  };

  const findListByCardId = (cardId, currentLists = lists) => {
    return currentLists.find((list) =>
      list.cards.some((card) => card.id === cardId)
    );
  };

  const activeCardData = useMemo(() => {
    if (!activeDragItem || !String(activeDragItem.id).startsWith("card-")) {
      return null;
    }

    const cardId = Number(String(activeDragItem.id).replace("card-", ""));
    const parentList = findListByCardId(cardId);

    if (!parentList) return null;

    return parentList.cards.find((card) => card.id === cardId) || null;
  }, [activeDragItem, lists]);

  const handleDragStart = (event) => {
    setActiveDragItem(event.active);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (!activeId.startsWith("card-")) return;

    const activeCardId = Number(activeId.replace("card-", ""));
    const activeLocation = findCardLocation(activeCardId);

    if (!activeLocation) return;

    let targetListId = null;
    let targetCardIndex = null;

    if (overId.startsWith("card-")) {
      const overCardId = Number(overId.replace("card-", ""));
      const overLocation = findCardLocation(overCardId);

      if (!overLocation) return;

      targetListId = overLocation.listId;
      targetCardIndex = overLocation.cardIndex;
    } else if (overId.startsWith("list-")) {
      targetListId = Number(overId.replace("list-", ""));
      const targetList = lists.find((list) => list.id === targetListId);
      targetCardIndex = targetList ? targetList.cards.length : 0;
    }

    if (!targetListId || activeLocation.listId === targetListId) return;

    const updatedLists = [...lists];

    const sourceListIndex = updatedLists.findIndex(
      (list) => list.id === activeLocation.listId
    );
    const targetListIndex = updatedLists.findIndex(
      (list) => list.id === targetListId
    );

    if (sourceListIndex === -1 || targetListIndex === -1) return;

    const sourceCards = [...updatedLists[sourceListIndex].cards];
    const targetCards = [...updatedLists[targetListIndex].cards];

    const [movedCard] = sourceCards.splice(activeLocation.cardIndex, 1);

    if (!movedCard) return;

    targetCards.splice(targetCardIndex, 0, movedCard);

    updatedLists[sourceListIndex] = {
      ...updatedLists[sourceListIndex],
      cards: sourceCards,
    };

    updatedLists[targetListIndex] = {
      ...updatedLists[targetListIndex],
      cards: targetCards,
    };

    setLists(updatedLists);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("list-") && overId.startsWith("list-")) {
      const activeListId = Number(activeId.replace("list-", ""));
      const overListId = Number(overId.replace("list-", ""));

      const oldIndex = lists.findIndex((list) => list.id === activeListId);
      const newIndex = lists.findIndex((list) => list.id === overListId);

      if (oldIndex === -1 || newIndex === -1) return;

      const updatedLists = arrayMove(lists, oldIndex, newIndex);
      setLists(updatedLists);
      await persistListOrder(updatedLists);
      return;
    }

    if (activeId.startsWith("card-")) {
      const activeCardId = Number(activeId.replace("card-", ""));
      const activeLocation = findCardLocation(activeCardId);

      if (!activeLocation) return;

      if (overId.startsWith("card-")) {
        const overCardId = Number(overId.replace("card-", ""));
        const overLocation = findCardLocation(overCardId);

        if (!overLocation) return;

        if (activeLocation.listId === overLocation.listId) {
          const updatedLists = [...lists];
          const listIndex = updatedLists.findIndex(
            (list) => list.id === activeLocation.listId
          );

          const updatedCards = arrayMove(
            updatedLists[listIndex].cards,
            activeLocation.cardIndex,
            overLocation.cardIndex
          );

          updatedLists[listIndex] = {
            ...updatedLists[listIndex],
            cards: updatedCards,
          };

          setLists(updatedLists);
          await persistCardOrder(updatedLists);
          return;
        }

        await persistCardOrder(lists);
        return;
      }

      if (overId.startsWith("list-")) {
        await persistCardOrder(lists);
      }
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;

    try {
      await axiosInstance.post(`/lists/boards/${id}/lists`, {
        title: newListTitle,
      });
      setNewListTitle("");
      fetchBoardDetails();
    } catch (error) {
      console.error("Error creating list:", error);
    }
  };

  const handleEditList = async (listId, currentTitle) => {
    const updatedTitle = prompt("Enter new list title:", currentTitle);
    if (!updatedTitle || !updatedTitle.trim()) return;

    try {
      await axiosInstance.put(`/lists/${listId}`, {
        title: updatedTitle,
      });
      fetchBoardDetails();
    } catch (error) {
      console.error("Error updating list:", error);
    }
  };

  const handleDeleteList = async (listId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this list?"
    );
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/lists/${listId}`);
      fetchBoardDetails();
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  const handleCardInputChange = (listId, value) => {
    setNewCardTitles((prev) => ({
      ...prev,
      [listId]: value,
    }));
  };

  const handleCreateCard = async (listId) => {
    const cardTitle = newCardTitles[listId];
    if (!cardTitle || !cardTitle.trim()) return;

    try {
      await axiosInstance.post(`/cards/lists/${listId}/cards`, {
        title: cardTitle,
        description: "",
      });

      setNewCardTitles((prev) => ({
        ...prev,
        [listId]: "",
      }));

      fetchBoardDetails();
    } catch (error) {
      console.error("Error creating card:", error);
    }
  };

  const handleEditCard = async (card) => {
    const updatedTitle = prompt("Enter new card title:", card.title);
    if (!updatedTitle || !updatedTitle.trim()) return;

    const updatedDescription = prompt(
      "Enter new card description:",
      card.description || ""
    );

    try {
      await axiosInstance.put(`/cards/${card.id}`, {
        title: updatedTitle,
        description: updatedDescription || "",
      });
      fetchBoardDetails();
    } catch (error) {
      console.error("Error updating card:", error);
    }
  };

  const handleDeleteCard = async (cardId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this card?"
    );
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/cards/${cardId}`);
      fetchBoardDetails();
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  const handleArchiveCard = async (cardId) => {
    const confirmArchive = window.confirm(
      "Are you sure you want to archive this card?"
    );
    if (!confirmArchive) return;

    try {
      await axiosInstance.put(`/cards/${cardId}/archive`);
      fetchBoardDetails();
    } catch (error) {
      console.error("Error archiving card:", error);
    }
  };

  const fetchFilterData = async () => {
    try {
      const labelsRes = await axiosInstance.get(`/meta/boards/${id}/labels`);
      const membersRes = await axiosInstance.get(`/meta/members`);

      setAvailableLabels(labelsRes.data.labels || []);
      setAvailableMembers(membersRes.data.members || []);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  useEffect(() => {
    fetchBoardDetails();
    fetchFilterData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading board...
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-red-600">Board not found</p>
        <Link to="/" className="text-blue-600 underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: board.background || "#0079bf" }}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">{board.title}</h1>

          <Link
            to="/"
            className="bg-white text-slate-800 px-4 py-2 rounded-lg font-medium shadow hover:bg-slate-100"
          >
            Back to Boards
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 rounded border w-[220px]"
          />

          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="px-3 py-2 rounded border"
          >
            <option value="">Filter by Label</option>
            {availableLabels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-3 py-2 rounded border"
          >
            <option value="">Filter by Member</option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            className="px-3 py-2 rounded border"
          >
            <option value="">Filter by Due Date</option>
            <option value="today">Due Today</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={lists.map((list) => `list-${list.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-6 overflow-x-auto pb-6 mt-4">
            {lists.map((list) => {
              const filteredCards = getFilteredCards(list.cards);

              return (
                <ListColumn key={list.id} list={list}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                      {list.title}
                    </h2>
                    <div className="flex gap-2">
                      <button
  onClick={(e) => {
    e.stopPropagation();
    handleEditList(list.id, list.title);
  }}
  className="text-sm bg-yellow-400 px-2 py-1 rounded"
>
  Edit
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteList(list.id);
  }}
  className="text-sm bg-red-500 text-white px-2 py-1 rounded"
>
  Delete
</button>
                    </div>
                  </div>

                  <SortableContext
                    items={filteredCards.map((card) => `card-${card.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 mb-4 min-h-[20px]">
                      {filteredCards.length > 0 ? (
                        filteredCards.map((card) => (
                          <CardItem key={card.id} card={card}>
                            <div
                              onClick={() => setSelectedCardId(card.id)}
                              className="cursor-pointer"
                            >
                              <h3 className="font-medium">{card.title}</h3>
                              {card.description && (
                                <p className="text-sm text-slate-500 mt-1">
                                  {card.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCard(card);
                                }}
                                className="text-xs px-2.5 py-1 rounded-md font-medium bg-amber-400 text-black"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCard(card.id);
                                }}
                                className="text-xs px-2.5 py-1 rounded-md font-medium bg-rose-500 text-white"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveCard(card.id);
                                }}
                                className="text-xs px-2.5 py-1 rounded-md font-medium bg-slate-700 text-white"
                              >
                                Archive
                              </button>
                            </div>
                          </CardItem>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No matching cards</p>
                      )}
                    </div>
                  </SortableContext>

                  <div className="border-t pt-3">
                    <input
                      type="text"
                      placeholder="Enter card title"
                      value={newCardTitles[list.id] || ""}
                      onChange={(e) =>
                        handleCardInputChange(list.id, e.target.value)
                      }
                      className="w-full p-2 rounded border border-slate-300 mb-2"
                    />
                    <button
                      onClick={() => handleCreateCard(list.id)}
                      className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Add Card
                    </button>
                  </div>
                </ListColumn>
              );
            })}

            <div className="min-w-[320px] bg-slate-200 rounded-xl p-4 shadow-md h-fit">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Add New List
              </h2>
              <input
                type="text"
                placeholder="Enter list title"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                className="w-full p-2 rounded border border-slate-300 mb-3"
              />
              <button
                onClick={handleCreateList}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Add List
              </button>
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCardData ? (
            <div className="bg-white rounded-lg p-3 shadow-lg text-slate-700 w-[280px]">
              <h3 className="font-medium">{activeCardData.title}</h3>
              {activeCardData.description && (
                <p className="text-sm text-slate-500 mt-1">
                  {activeCardData.description}
                </p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {selectedCardId && (
        <CardDetailsModal
          cardId={selectedCardId}
          boardId={id}
          onClose={() => setSelectedCardId(null)}
          onRefreshBoard={fetchBoardDetails}
        />
      )}
    </div>
  );
}

export default BoardPage;