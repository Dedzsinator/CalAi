defmodule CalAiWeb.Gettext do
  @moduledoc """
  A module providing Internationalization with a gettext-based macro.

  This module provides the `gettext/1` macro and other localization
  functions to format strings and messages based on locale.
  """

  use Gettext.Backend, otp_app: :calai
end
