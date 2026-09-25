// Запускает DeepSeek в отдельном окне Microsoft Edge.
// Профиль (вход в аккаунт) и расширение берутся из папки рядом с DeepSeek.exe.
// Рядом с exe создаётся ярлык DeepSeek.lnk, чтобы его можно было перетащить на рабочий стол.
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("DeepSeek")]
[assembly: AssemblyProduct("DeepSeek Voice Desktop")]
[assembly: AssemblyVersion("1.0.1.0")]

static class Launcher
{
    const string Url = "https://chat.deepseek.com/";

    [STAThread]
    static void Main()
    {
        string dir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
        string[] candidates =
        {
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86) + @"\Microsoft\Edge\Application\msedge.exe",
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) + @"\Microsoft\Edge\Application\msedge.exe",
        };
        string edge = Array.Find(candidates, File.Exists);
        if (edge == null)
        {
            MessageBox.Show("Microsoft Edge не найден. Установите его с microsoft.com/edge.", "DeepSeek",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        // Отдельный профиль: окно всегда отдельный процесс Edge, иначе --load-extension
        // игнорируется, когда обычный Edge уже открыт.
        string args = string.Format(
            "--user-data-dir=\"{0}\" --load-extension=\"{1}\" --no-first-run --no-default-browser-check --app={2}",
            Path.Combine(dir, "profile"), Path.Combine(dir, "extension"), Url);
        Process.Start(new ProcessStartInfo(edge, args) { UseShellExecute = false, WorkingDirectory = dir });

        EnsureShortcut(dir);
    }

    // Кладёт рядом с exe ярлык DeepSeek.lnk, который можно перетащить на рабочий стол.
    // Ярлык хранит полный путь, поэтому создаётся на месте и обновляется, если папку перенесли.
    static void EnsureShortcut(string dir)
    {
        try
        {
            string exe = Assembly.GetExecutingAssembly().Location;
            string path = Path.Combine(dir, "DeepSeek.lnk");
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            object shell = Activator.CreateInstance(shellType);
            object lnk = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { path });
            Type t = lnk.GetType();
            string current = (string)t.InvokeMember("TargetPath", BindingFlags.GetProperty, null, lnk, null);
            if (File.Exists(path) && string.Equals(current, exe, StringComparison.OrdinalIgnoreCase)) return;
            t.InvokeMember("TargetPath", BindingFlags.SetProperty, null, lnk, new object[] { exe });
            t.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, lnk, new object[] { dir });
            t.InvokeMember("IconLocation", BindingFlags.SetProperty, null, lnk, new object[] { exe + ",0" });
            t.InvokeMember("Description", BindingFlags.SetProperty, null, lnk, new object[] { "DeepSeek" });
            t.InvokeMember("Save", BindingFlags.InvokeMethod, null, lnk, null);
        }
        catch
        {
            // ярлык — удобство, без него приложение работает
        }
    }
}
