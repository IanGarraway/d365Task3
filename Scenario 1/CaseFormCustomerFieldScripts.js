this.SetAccountOnCustomerChange = function (executionContext) {

    //Get form context
    var formContext = executionContext.getFormContext();

    //Get customerField type
    var customerField = formContext.getAttribute("customerid");    

    if (customerField && customerField.getValue() !== null) {
        
        //get the lookup value
        var customer = customerField.getValue()[0];

        //checking entity type

        if (customer.entityType === "account") {

            // Retrieve the primary contact from the account and set it
            getContactFromAccount(customer.id).then(function (primaryContact) {
                if (primaryContact) {
                    setContact(formContext, primaryContact);
                }
            }).catch(function (error) {
                formContext.ui.setFormNotification("Error retrieving primary contact: " + error.message, "ERROR", "ERPCMessage");
            });
            
        } else if (customer.entityType === "contact") {
            setContact(formContext, customer);
            
        } 
        
    }
    
}

//This method to set the contact field to the correct contact
this.setContact = function (formContext, contactToSet) {
    console.log("v1.1 Setting Contact:", contactToSet);
    var contactField = formContext.getAttribute("primarycontactid");

    if (contactField.getValue() === null) {
        contactField.setValue([
            {
                id: contactToSet.id,
                name: contactToSet.name,
                entityType: "contact",
            },
        ]);
        console.log("Contact Field Updated Successfully");
    } else {
        console.log("Contact Field Already Has a Value");
    }

}

//this methods retrieves the primary contact of an account
this.getContactFromAccount = function (accountId) {
    return new Promise(function (resolve, reject) {
        Xrm.WebApi.retrieveRecord("account", accountId, "?$select=primarycontactid").then(
            function success(result) {
                if (result.primarycontactid) {
                    resolve({
                        id: result.primarycontactid.id,
                        name: result.primarycontactid.name,
                    });
                } else {
                    resolve(null); // No primary contact associated
                }
            },
            function error(error) {
                reject(error);
            }
        );
    });
};