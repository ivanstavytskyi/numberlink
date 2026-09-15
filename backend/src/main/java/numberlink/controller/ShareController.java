package numberlink.controller;

import jakarta.validation.Valid;
import numberlink.dto.share.request.GenerateShareTokenRequestDto;
import numberlink.dto.share.request.RemoveShareTokenRequestDto;
import numberlink.dto.share.resposnse.ShareResultDto;
import numberlink.dto.share.resposnse.ShareTokenDto;
import numberlink.service.share.ShareService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    @GetMapping("/search/{token}")
    public ResponseEntity<ShareResultDto> searchByToken(@PathVariable String token) {
        return ResponseEntity.ok(shareService.findSharedResult(token));
    }

    @PostMapping("/share/generate")
    public ResponseEntity<ShareTokenDto> generateShareToken(@Valid @RequestBody GenerateShareTokenRequestDto token) {
        return ResponseEntity.ok(shareService.generateShareToken(token.getGameToken()));
    }

    @PostMapping("/share/revoke")
    public ResponseEntity<Void> revokeShareToken(@RequestBody RemoveShareTokenRequestDto token) {
        shareService.revokeShareToken(token.getGameToken());
        return ResponseEntity.noContent().build();
    }
}
