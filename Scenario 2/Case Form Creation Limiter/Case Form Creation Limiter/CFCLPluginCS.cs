using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace Case_Form_Creation_Limiter
{
    public class CaseFormCreationLimiter : IPlugin    {
        

        /// <summary>
        /// This plugin will stop the creation of new cases where the account already has at least one open case
        /// </summary>
        /// <param name="serviceProvider"></param>
        public void Execute(IServiceProvider serviceProvider)
        {

            //Assign datastructures to variable names
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));


            // Obtain the organization service
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            var service = serviceFactory.CreateOrganizationService(context.UserId);

            try
            {
                //Check the program is able to access the forms data
                if (!(context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity targetEntity))
                {
                    throw new InvalidPluginExecutionException("Error accessing the form");
                }
                //Check to ensure the customerid is available
                if (!targetEntity.Contains("customerid"))
                {
                    throw new InvalidPluginExecutionException("Customer data not available");
                }

                EntityReference accountReference = (EntityReference)targetEntity["customerid"];
                tracingService.Trace($"Checking for open cases for Account id: {accountReference.Id}"); //First trace message

                EntityCollection cases = GetCases(service, QueryBuilder(accountReference));

                if(cases.Entities.Count > 0)
                {                    

                    if (cases[0].Attributes.Contains("title"))
                    {                        
                        string caseTitle = cases.Entities[0].Attributes["title"].ToString();                        
                        
                        throw new InvalidPluginExecutionException($"An open case ('{caseTitle}') already exists for the selected account");
                    }
                    throw new InvalidPluginExecutionException($"An open case already exists for the selected account");
                }

                tracingService.Trace("New Case creation allowed.");



            }
            catch (InvalidPluginExecutionException ex) //catch any InvalidPluginExecutionExceptions, produce a trace message and rethrow the exception
            {
                tracingService.Trace("Unable to create the new case: "+ex.Message);
                throw;

            }
            catch(Exception ex) //catch any unexpected errors and throws an invalidPluginExecutionException 
            {
                tracingService.Trace("An unexpected error has caused creation of this case to terminate");
                tracingService.Trace(ex.ToString());
                throw new InvalidPluginExecutionException("An unexpected error occurred in the plugin. Please contact support.", ex);


            }
        }

        //This method generates the query for all active cases for the selected account
        private QueryExpression QueryBuilder(EntityReference accountReference)
        {
            QueryExpression query = new QueryExpression("incident")
            {
                ColumnSet = new ColumnSet("incidentid", "title"),
                Criteria =
                {
                    Conditions =
                    {
                        new ConditionExpression("customerid", ConditionOperator.Equal, accountReference.Id),
                        new ConditionExpression("statecode", ConditionOperator.Equal, 0) //state: active
                    }
                },
                TopCount = 1 //Limit to 1 result for performance
            };
            return query;

        }

        //takes the query built by the QueryBuilder method and uses it to retrieve the relevant cases
        private EntityCollection GetCases(IOrganizationService service, QueryExpression query)
        {
            EntityCollection cases = service.RetrieveMultiple(query);
            return cases;

        }
    }
}
