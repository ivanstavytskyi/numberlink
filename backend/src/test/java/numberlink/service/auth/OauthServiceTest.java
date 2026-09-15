package numberlink.service.auth;

import numberlink.entity.OauthUserEntity;
import numberlink.entity.UserEntity;
import numberlink.entity.enums.OauthProvider;
import numberlink.repository.LocalUserRepository;
import numberlink.repository.OauthUserRepository;
import numberlink.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OauthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private OauthUserRepository oauthUserRepository;
    @Mock private LocalUserRepository localUserRepository;

    @InjectMocks private OauthService oauthService;

    @BeforeEach
    void stubUserSave() {
        lenient().when(userRepository.saveAndFlush(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            if (user.getId() == null) {
                user.setId(UUID.randomUUID());
            }
            return user;
        });
        lenient().when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(userRepository.existsByUsernameIgnoreCase(any())).thenReturn(false);
        lenient().when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        lenient().when(oauthUserRepository.findByProviderAndSub(any(), any())).thenReturn(Optional.empty());
        lenient().when(oauthUserRepository.saveAndFlush(any(OauthUserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void googleRegister_savesPictureUrlWithQueryParams() {
        String picture = "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c?sz=64";
        DefaultOAuth2User oauthUser = new DefaultOAuth2User(
                Set.of(new SimpleGrantedAuthority("OIDC_USER")),
                Map.of(
                        "sub", "google-sub-1",
                        "email", "alex@example.com",
                        "name", "Alex",
                        "picture", picture
                ),
                "sub"
        );

        UserEntity user = oauthService.loginOrRegister(oauthUser, "google");

        assertThat(user.getAvatarUrl()).isEqualTo(picture);
        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getAvatarUrl()).isEqualTo(picture);
    }

    @Test
    void githubRegister_savesAvatarUrlWithQueryParams() {
        String avatar = "https://avatars.githubusercontent.com/u/9919?v=4";
        DefaultOAuth2User oauthUser = new DefaultOAuth2User(
                Set.of(new SimpleGrantedAuthority("OAUTH2_USER")),
                Map.of(
                        "id", 9919,
                        "login", "octocat",
                        "name", "The Octocat",
                        "avatar_url", avatar
                ),
                "id"
        );

        UserEntity user = oauthService.loginOrRegister(oauthUser, "github");

        assertThat(user.getAvatarUrl()).isEqualTo(avatar);
    }

    @Test
    void sanitizeAvatarUrl_keepsHttpsQueryAndRejectsHttp() {
        assertThat(OauthService.sanitizeAvatarUrl("https://avatars.githubusercontent.com/u/1?v=4&s=80"))
                .isEqualTo("https://avatars.githubusercontent.com/u/1?v=4&s=80");
        assertThat(OauthService.sanitizeAvatarUrl("http://evil.example/a.png")).isNull();
        assertThat(OauthService.sanitizeAvatarUrl("javascript:alert(1)")).isNull();
    }

    @Test
    void existingGoogleLogin_fillsAvatarWhenUserHasNone() {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setUsername("alex");
        OauthUserEntity link = new OauthUserEntity();
        link.setUser(user);
        link.setProvider(OauthProvider.GOOGLE);
        link.setSub("google-sub-1");
        when(oauthUserRepository.findByProviderAndSub(OauthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.of(link));

        String picture = "https://lh3.googleusercontent.com/a/ACg8ocLater=s96-c?sz=128";
        DefaultOAuth2User oauthUser = new DefaultOAuth2User(
                Set.of(new SimpleGrantedAuthority("OIDC_USER")),
                Map.of(
                        "sub", "google-sub-1",
                        "email", "alex@example.com",
                        "picture", picture
                ),
                "sub"
        );

        UserEntity result = oauthService.loginOrRegister(oauthUser, "google");

        assertThat(result.getAvatarUrl()).isEqualTo(picture);
    }
}
