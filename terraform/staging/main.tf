# We strongly recommend using the required_providers block to set the
# Azure Provider source and version being used
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=2.91.0"
    }
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
  subscription_id = "48109e19-5570-4488-87cc-5f768f1a2fd7"
}

resource "azurerm_resource_group" "rg" {
  name = var.resource_group_name
  location = var.resource_group_location
  tags = {
    Name = var.project_name
    PI = var.project_pi
    Contributors = var.project_contributors
  }
}

resource "azurerm_storage_account" "storage" {
  name                      = "${var.project_name}storage"
  resource_group_name       = azurerm_resource_group.rg.name
  location                  = azurerm_resource_group.rg.location
  account_tier              = "Standard"
  account_replication_type  = "LRS"
}

resource "azurerm_app_service_plan" "asp" {
  name                = "${var.project_name}plan"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  kind = "Linux"
  reserved = "true"

  sku {
    tier = "Basic"
    size = "B1"
  }
}

resource "azurerm_app_service" "as" {
  name                = "${var.project_name}app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  app_service_plan_id = azurerm_app_service_plan.asp.id
  https_only          = "true"

  site_config {                                                            
     linux_fx_version = "PYTHON|3.8"                                        
   }

  tags = {
    Name = var.project_name
    PI = var.project_pi
    Contributors = var.project_contributors
  }
}