package api

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Order struct {
	ID         int       `json:"id,omitempty"`
	CreatedAt  time.Time `json:"created_at,omitzero"`
	NameID     int       `json:"name_id"`
	ListID     int       `json:"list_id"`
	OrderIndex int       `json:"order_index"`
}

func (server *Server) getNextName(chosenNamesRecords []Name) Name {
	signatureToFind := buildListSignature(chosenNamesRecords)

	var nameListResults []NameList
	err := server.supaclient.DB.From("name_lists").
		Select("*").
		Eq("canonical_signature", signatureToFind).
		Execute(&nameListResults)

	if err != nil {
		panic(fmt.Sprintf("Error finding name list: %v", err))
	}

	if len(nameListResults) > 1 {
		panic(fmt.Sprintf("More than one row matching the canonical signature '%s' exist: %v", signatureToFind, nameListResults))
	}

	if len(nameListResults) == 0 {
		newNameList := NameList{
			CanonicalSignature: signatureToFind,
		}

		err := server.supaclient.DB.From("name_lists").
			Insert(newNameList).
			Execute(&nameListResults)

		if err != nil {
			panic(err)
		}

		orderIndexes := rand.Perm(len(chosenNamesRecords))

		orderEntries := make([]Order, 0, len(chosenNamesRecords))
		for _, nameRecord := range chosenNamesRecords {
			nextOrderIndex := orderIndexes[0]
			orderIndexes = orderIndexes[1:]

			newOrderEntry := Order{
				NameID:     nameRecord.ID,
				ListID:     nameListResults[0].ID,
				OrderIndex: nextOrderIndex,
			}
			orderEntries = append(orderEntries, newOrderEntry)
		}

		var orderEntriesResults []Order
		err = server.supaclient.DB.From("orders").
			Insert(orderEntries).
			Execute(&orderEntriesResults)
		if err != nil {
			panic(err)
		}
	}

	nameListResult := nameListResults[0]

	var orderRecord Order
	err = server.supaclient.DB.From("orders").
		Select("*").
		Single().
		Eq("list_id", fmt.Sprintf("%d", nameListResult.ID)).
		Eq("order_index", "0").
		Execute(&orderRecord)

	if err != nil {
		panic(err)
	}

	var nextNameRecord Name
	err = server.supaclient.DB.From("names").
		Select("*").
		Single().
		Eq("id", fmt.Sprintf("%d", orderRecord.NameID)).
		Execute(&nextNameRecord)

	if err != nil {
		panic(err)
	}

	return nextNameRecord
}

func (server *Server) updateOrderHandler(c *gin.Context) {
	var names APIRequest
	if err := c.ShouldBindJSON(&names); err != nil {
		c.String(http.StatusBadRequest, "Invalid request body")
		return
	}

	records := server.stringsToNames(names.Names)
	signature := buildListSignature(records)

	var nameLists []NameList
	err := server.supaclient.DB.From("name_lists").
		Select("id").
		Limit(1).
		Eq("canonical_signature", signature).
		Execute(&nameLists)

	if err != nil {
		c.String(http.StatusInternalServerError, "Database query error")
		return
	}

	if len(nameLists) == 0 {
		nextName := server.getNextName(records).Name
		c.JSON(http.StatusOK, APIResponse{ChosenName: nextName})
		return
	}

	listID := nameLists[0].ID

	params := map[string]any{
		"search_list_id": listID,
	}
	var updatedOrders []Order
	err = server.supaclient.DB.Rpc("update_order", params).Execute(&updatedOrders)
	if err != nil {
		c.String(
			http.StatusNotFound,
			fmt.Sprintf("Error while running DB function 'update_order': %v", err),
		)
		return
	}

	var newChosenNameID int
	for _, order := range updatedOrders {
		if order.OrderIndex == 0 {
			newChosenNameID = order.NameID
			break
		}
	}

	var newChosenName Name
	err = server.supaclient.DB.From("names").
		Select("*").
		Single().
		Eq("id", fmt.Sprintf("%d", newChosenNameID)).
		Execute(&newChosenName)

	if err != nil {
		c.String(
			http.StatusInternalServerError,
			fmt.Sprintf("Error while trying to find unique Name entry with ID '%v'", newChosenNameID),
		)
		return
	}

	c.JSON(http.StatusOK, APIResponse{ChosenName: newChosenName.Name})
}

func (server *Server) chooseHandler(c *gin.Context) {
	var req APIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.String(http.StatusBadRequest, "Invalid request body")
		return
	}

	chosenNamesRecords := server.stringsToNames(req.Names)
	nextName := server.getNextName(chosenNamesRecords).Name

	c.JSON(http.StatusOK, APIResponse{ChosenName: nextName})
}
